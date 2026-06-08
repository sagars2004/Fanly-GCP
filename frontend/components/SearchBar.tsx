"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (params: {
    query: string;
    dates?: string;
    maxPrice?: number;
    language?: string;
    teamPreference?: string;
    guests?: number;
  }) => void;
  isLoading?: boolean;
  initialParams?: {
    query: string;
    dates?: string;
    teamPreference?: string;
    guests?: number;
  } | null;
}

export default function SearchBar({ onSearch, isLoading = false, initialParams = null }: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialParams?.query || "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(initialParams?.guests || 1);
  const [teamPreference, setTeamPreference] = useState(initialParams?.teamPreference || "");
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  useEffect(() => {
    if (initialParams) {
      setQuery(initialParams.query || "");
      if (initialParams.dates) {
        const parts = initialParams.dates.split(" to ");
        setCheckIn(parts[0] || "");
        setCheckOut(parts[1] || "");
      } else {
        setCheckIn("");
        setCheckOut("");
      }
      setGuests(initialParams.guests || 1);
      setTeamPreference(initialParams.teamPreference || "");
    }
  }, [initialParams]);

  const isFormComplete = query.trim() !== "" && checkIn.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormComplete) {
      alert("Please enter Where and When details to complete your search!");
      return;
    }
    
    let dates = "";
    if (checkIn && checkOut) {
      dates = `${checkIn} to ${checkOut}`;
    } else if (checkIn) {
      dates = checkIn;
    }

    onSearch({
      query,
      dates: dates || undefined,
      maxPrice: undefined,
      language: undefined,
      teamPreference: teamPreference || undefined,
      guests: guests
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-center bg-card border border-border rounded-2xl md:rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300 w-full"
      >
        {/* Segment 1: Where */}
        <div className="flex-grow w-full md:w-auto px-6 py-2 border-b md:border-b-0 md:border-r border-border flex flex-col items-start gap-0.5">
          <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Where</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city or landmark"
            className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/75 font-semibold"
          />
        </div>

        {/* Segment 2: When */}
        <div className="w-full md:w-48 px-6 py-2 border-b md:border-b-0 md:border-r border-border flex flex-col items-start gap-0.5 relative">
          <label className="text-[10px] uppercase font-black tracking-wider text-foreground">When</label>
          <div className="flex gap-1 items-center w-full">
            <input
              type="text"
              placeholder="Add dates"
              value={checkIn && checkOut ? `${checkIn} to ${checkOut}` : checkIn ? checkIn : ""}
              onFocus={(e) => {
                e.target.type = "date";
              }}
              onChange={(e) => {
                if (!checkIn) {
                  setCheckIn(e.target.value);
                } else {
                  setCheckOut(e.target.value);
                  e.target.type = "text";
                }
              }}
              className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/75 font-semibold cursor-pointer"
            />
            {(checkIn || checkOut) && (
              <button 
                type="button" 
                onClick={() => { setCheckIn(""); setCheckOut(""); }}
                className="text-xs text-muted-foreground hover:text-foreground font-black px-1.5"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Segment 3: Rooting For */}
        <div className="w-full md:w-40 px-6 py-2 border-b md:border-b-0 md:border-r border-border flex flex-col items-start gap-0.5">
          <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Rooting For</label>
          <input
            type="text"
            value={teamPreference}
            onChange={(e) => setTeamPreference(e.target.value)}
            placeholder="e.g. Brazil"
            className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/75 font-semibold"
          />
        </div>

        {/* Segment 4: Who */}
        <div className="w-full md:w-40 px-6 py-2 flex items-center justify-between gap-1 relative">
          <div className="flex flex-col items-start gap-0.5 flex-grow">
            <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Who</label>
            <button
              type="button"
              onClick={() => setShowGuestsDropdown(!showGuestsDropdown)}
              className="text-sm text-foreground/80 hover:text-foreground font-semibold bg-transparent border-0 p-0 text-left focus:outline-none"
            >
              {guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}
            </button>
            
            {showGuestsDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-3 z-50 flex flex-col gap-2 min-w-[150px]">
                <span className="text-xs font-bold text-muted-foreground">Guests</span>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center font-bold text-foreground hover:bg-muted"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-foreground">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    className="w-7 h-7 rounded-full border border-border flex items-center justify-center font-bold text-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={!isFormComplete || isLoading}
            className="w-12 h-12 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
