"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { fetchMatches, Match } from "../lib/agentClient";
import { CalendarRange, Info, AlertTriangle, Users } from "lucide-react";

interface MatchScheduleOverlayProps {
  checkIn?: string;
  checkOut?: string;
}

export default function MatchScheduleOverlay({ checkIn, checkOut }: MatchScheduleOverlayProps) {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadMatches() {
      if (!checkIn || !checkOut) return;
      setIsLoading(true);
      try {
        const data = await fetchMatches(`${checkIn} to ${checkOut}`, "MetLife Stadium");
        setMatches(data);
      } catch (err) {
        console.error("Error loading overlapping matches", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMatches();
  }, [checkIn, checkOut]);

  if (!checkIn || !checkOut) return null;
  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-muted-foreground font-semibold">Scanning FIFA schedules...</span>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 dark:bg-amber-500/5 space-y-3">
      
      {/* Title */}
      <h4 className="font-extrabold text-sm md:text-base text-accent dark:text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
        <CalendarRange className="w-4.5 h-4.5" />
        {t("matchScheduleOverlayTitle")}
      </h4>

      {/* Warning Alert */}
      <div className="p-3 rounded-lg bg-background border border-accent/20 flex gap-2.5 items-start">
        <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-foreground/90 font-medium leading-relaxed">
          {t("stadiumMatchWarn")}
        </p>
      </div>

      {/* Matches List */}
      <div className="space-y-2">
        {matches.map((match) => (
          <div 
            key={match.match_id}
            className="p-3 rounded-lg bg-card border border-border/80 flex items-center justify-between gap-4 hover:border-accent/40 transition-colors shadow-sm"
          >
            <div className="space-y-1">
              {/* Teams & Round */}
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-bold text-foreground">
                  {match.home_team} vs {match.away_team}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
                  {match.round}
                </span>
              </div>
              
              {/* Time & Location */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                <span>{match.date} @ {match.time}</span>
                <span>{match.stadium}</span>
              </div>
            </div>

            {/* Attendance indicator */}
            <div className="flex flex-col items-end shrink-0">
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                match.expected_attendance === "high" 
                  ? "bg-red-500/10 text-red-500 border-red-500/20" 
                  : "bg-green-500/10 text-green-500 border-green-500/20"
              }`}>
                <Users className="w-3 h-3" />
                <span>{match.expected_attendance} Attendance</span>
              </span>
              {match.surge_indicator && (
                <span className="text-[9px] text-accent dark:text-amber-500 font-extrabold mt-1">
                  ⚡ Surge pricing active
                </span>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
