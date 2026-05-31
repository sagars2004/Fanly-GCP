"use client";

import React, { useState } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { Search, SlidersHorizontal, Calendar, DollarSign, Globe, Award } from "lucide-react";

interface SearchBarProps {
  onSearch: (params: {
    query: string;
    dates?: string;
    maxPrice?: number;
    language?: string;
    teamPreference?: string;
  }) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Structured Filters State
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [maxPrice, setMaxPrice] = useState(200);
  const [hostLang, setHostLang] = useState("");
  const [teamPref, setTeamPref] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let dates = "";
    if (checkIn && checkOut) {
      dates = `${checkIn} to ${checkOut}`;
    } else if (checkIn) {
      dates = checkIn;
    }

    onSearch({
      query,
      dates: dates || undefined,
      maxPrice: showFilters ? maxPrice : undefined,
      language: showFilters && hostLang ? hostLang : undefined,
      teamPreference: showFilters && teamPref ? teamPref : undefined
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Main Search Bar */}
        <div className="flex flex-col md:flex-row gap-2 items-stretch">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-3 md:py-4 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base shadow-sm placeholder:text-muted-foreground/70"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 md:p-4 rounded-xl border border-border flex items-center justify-center gap-1.5 transition-all text-sm font-semibold ${
                showFilters 
                  ? "bg-muted text-foreground border-primary/50 shadow-inner" 
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle Filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">{t("structuredSearch")}</span>
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="flex-grow md:flex-grow-0 px-6 py-3 md:py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-75 flex items-center justify-center gap-2 text-sm md:text-base min-w-[140px]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>{t("searchBtn")}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Structured Filters Collapsible Panel */}
        {showFilters && (
          <div className="p-5 rounded-xl border border-border bg-card/55 backdrop-blur-md glass-panel grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-float-quick transition-all">
            
            {/* Dates of Stay */}
            <div className="space-y-1.5 col-span-1 sm:col-span-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t("dates")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            {/* Budget Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                {t("budget")} ({maxPrice} USD)
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="range"
                  min="30"
                  max="300"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-primary bg-muted rounded-lg h-2"
                />
              </div>
            </div>

            {/* Language Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {t("language")}
              </label>
              <select
                value={hostLang}
                onChange={(e) => setHostLang(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                <option value="">{t("anyLanguage")}</option>
                <option value="English">English</option>
                <option value="Spanish">Español (Spanish)</option>
                <option value="Portuguese">Português (Portuguese)</option>
                <option value="French">Français (French)</option>
                <option value="Arabic">العربية (Arabic)</option>
              </select>
            </div>

            {/* Team Welcome Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                {t("teamWelcome")}
              </label>
              <select
                value={teamPref}
                onChange={(e) => setTeamPref(e.target.value)}
                className="w-full px-3 py-2 text-xs md:text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground col-span-1"
              >
                <option value="">{t("anyTeam")}</option>
                <option value="Brazil">Brazil 🇧🇷</option>
                <option value="Argentina">Argentina 🇦🇷</option>
                <option value="USA">USA 🇺🇸</option>
                <option value="England">England 🏴󠁧󠁢󠁥󠁮󠁧󠁿</option>
                <option value="Spain">Spain 🇪🇸</option>
                <option value="Morocco">Morocco 🇲🇦</option>
              </select>
            </div>

          </div>
        )}
      </form>
    </div>
  );
}
