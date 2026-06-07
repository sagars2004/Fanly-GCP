"use client";

import React, { useState } from "react";
import { useAuth, DEMO_PROFILES } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { ShieldCheck, Trophy, UserCheck, X } from "lucide-react";

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login, loginAsProfile } = useAuth();
  const { t } = useLanguage();
  const [customName, setCustomName] = useState("");
  const [customRole, setCustomRole] = useState<"fan" | "host">("fan");

  if (!isLoginModalOpen) return null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert("Please enter a valid display name.");
      return;
    }
    login(customName, customRole);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div 
        className="relative bg-card border-2 border-primary/20 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-float-quick"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pitch Green Accent Banner */}
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-muted/50 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent animate-pulse" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
              World Cup Match Pass
            </h3>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(false)}
            className="p-1 border border-border/40 bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
            aria-label="Close Pass Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Demo Passes */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">
              Quick Select Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-4">
              {/* Cristiano Ronaldo Guest Profile Card */}
              <button
                type="button"
                onClick={() => loginAsProfile("fan_ronaldo")}
                className="flex flex-col items-center p-4 rounded-xl border border-border bg-background hover:border-secondary hover:shadow-md transition-all text-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary group-hover:border-secondary transition-colors relative z-10">
                  <img
                    src={DEMO_PROFILES.fan_ronaldo.avatarUrl}
                    alt="Cristiano"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-extrabold text-xs text-foreground mt-2 group-hover:text-secondary transition-colors relative z-10 line-clamp-1">
                  {DEMO_PROFILES.fan_ronaldo.name}
                </span>
                <span className="text-[8px] uppercase font-black text-white mt-1 tracking-wider bg-primary px-2 py-0.5 rounded-full relative z-10">
                  ⚽ Guest / Fan
                </span>
              </button>

              {/* Sagar Sahu Host Profile Card */}
              <button
                type="button"
                onClick={() => loginAsProfile("host_sagar")}
                className="flex flex-col items-center p-4 rounded-xl border border-border bg-background hover:border-secondary hover:shadow-md transition-all text-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary group-hover:border-secondary transition-colors relative z-10">
                  <img
                    src={DEMO_PROFILES.host_sagar.avatarUrl}
                    alt="Sagar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-extrabold text-xs text-foreground mt-2 group-hover:text-secondary transition-colors relative z-10 line-clamp-1">
                  {DEMO_PROFILES.host_sagar.name}
                </span>
                <span className="text-[8px] uppercase font-black text-white mt-1 tracking-wider bg-secondary px-2 py-0.5 rounded-full relative z-10">
                  🏠 Local Host
                </span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60"></div>
            </div>
            <span className="relative bg-card px-3 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              Or Customize Credentials
            </span>
          </div>

          {/* Custom Details Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Enter Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Cristiano Ronaldo or Sagar Sahu"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-bold placeholder:text-muted-foreground/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Choose Access Tier
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted border rounded-xl">
                <button
                  type="button"
                  onClick={() => setCustomRole("fan")}
                  className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                    customRole === "fan"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Guest / Fan
                </button>
                <button
                  type="button"
                  onClick={() => setCustomRole("host")}
                  className={`py-2 text-xs font-black rounded-lg uppercase tracking-wider transition-all ${
                    customRole === "host"
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Local Host
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary text-primary-foreground font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md mt-4 flex items-center justify-center gap-1.5 border border-primary/20"
            >
              <UserCheck className="w-4 h-4" />
              <span>Issue World Cup Pass</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
