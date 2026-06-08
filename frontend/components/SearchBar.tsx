"use client";

import React, { useState, useEffect, useRef } from "react";
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

const VALID_LOCATIONS = [
  { name: "New York", display: "New York, NY", sub: "Host city for the Final", icon: "🗽", searchTerms: ["new york", "ny", "nyc", "manhattan"] },
  { name: "Jersey City", display: "Jersey City, NJ", sub: "Close to MetLife Stadium", icon: "🏙️", searchTerms: ["jersey city", "jc", "jersey"] },
  { name: "Hoboken", display: "Hoboken, NJ", sub: "Waterfront views & transit hubs", icon: "🚉", searchTerms: ["hoboken", "hob"] },
  { name: "Harrison", display: "Harrison, NJ", sub: "Red Bull Arena neighborhood", icon: "⚽", searchTerms: ["harrison"] },
  { name: "Newark", display: "Newark, NJ", sub: "EWR airport access & dining", icon: "✈️", searchTerms: ["newark", "nwk"] },
  { name: "East Rutherford", display: "East Rutherford, NJ", sub: "Home of MetLife Stadium", icon: "🏟️", searchTerms: ["east rutherford", "metlife", "rutherford"] },
  { name: "Union City", display: "Union City, NJ", sub: "Convenient Lincoln Tunnel access", icon: "🚌", searchTerms: ["union city", "union"] },
  { name: "Queens", display: "Queens, NY", sub: "Cultural hub near airports", icon: "✈️", searchTerms: ["queens", "astoria", "flushing"] }
];

const WORLD_CUP_TEAMS = [
  { name: "United States", flag: "🇺🇸", code: "USA" },
  { name: "Mexico", flag: "🇲🇽", code: "MEX" },
  { name: "Canada", flag: "🇨🇦", code: "CAN" },
  { name: "Argentina", flag: "🇦🇷", code: "ARG" },
  { name: "Brazil", flag: "🇧🇷", code: "BRA" },
  { name: "Spain", flag: "🇪🇸", code: "ESP" },
  { name: "Portugal", flag: "🇵🇹", code: "POR" },
  { name: "France", flag: "🇫🇷", code: "FRA" },
  { name: "Germany", flag: "🇩🇪", code: "GER" },
  { name: "England", flag: "🇬🇧", code: "ENG" },
  { name: "Morocco", flag: "🇲🇦", code: "MAR" },
  { name: "Colombia", flag: "🇨🇴", code: "COL" },
  { name: "Italy", flag: "🇮🇹", code: "ITA" },
  { name: "Japan", flag: "🇯🇵", code: "JPN" },
  { name: "South Korea", flag: "🇰🇷", code: "KOR" },
  { name: "Uruguay", flag: "🇺🇾", code: "URU" },
  { name: "Netherlands", flag: "🇳🇱", code: "NED" },
  { name: "Croatia", flag: "🇭🇷", code: "CRO" },
  { name: "Belgium", flag: "🇧🇪", code: "BEL" },
  { name: "Senegal", flag: "🇸🇳", code: "SEN" },
  { name: "Ecuador", flag: "🇪🇨", code: "ECU" }
];

export default function SearchBar({ onSearch, isLoading = false, initialParams = null }: SearchBarProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialParams?.query || "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(initialParams?.guests || 1);
  const [teamPreference, setTeamPreference] = useState(initialParams?.teamPreference || "");
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [showWhereDropdown, setShowWhereDropdown] = useState(false);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const whereRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

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

  // Click outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (whereRef.current && !whereRef.current.contains(event.target as Node)) {
        setShowWhereDropdown(false);
      }
      if (teamRef.current && !teamRef.current.contains(event.target as Node)) {
        setShowTeamDropdown(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuestsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isFormComplete = query.trim() !== "" && checkIn.trim() !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the query matches one of the valid location names or display names (case-insensitive)
    const validLoc = VALID_LOCATIONS.find(
      loc => loc.name.toLowerCase() === query.trim().toLowerCase() || 
             loc.display.toLowerCase() === query.trim().toLowerCase()
    );

    if (!validLoc) {
      // Try to find a partial match or search term match
      const partialMatch = VALID_LOCATIONS.find(
        loc => loc.name.toLowerCase().includes(query.trim().toLowerCase()) || 
               loc.display.toLowerCase().includes(query.trim().toLowerCase()) ||
               loc.searchTerms.some(term => term.includes(query.trim().toLowerCase()))
      );

      if (partialMatch) {
        setQuery(partialMatch.name);
        // Continue with search using partial match
        let dates = "";
        if (checkIn && checkOut) {
          dates = `${checkIn} to ${checkOut}`;
        } else if (checkIn) {
          dates = checkIn;
        }

        onSearch({
          query: partialMatch.name,
          dates: dates || undefined,
          maxPrice: undefined,
          language: undefined,
          teamPreference: teamPreference || undefined,
          guests: guests
        });
      } else {
        alert("Please select a valid FIFA World Cup 26™ host location from the dropdown list (e.g. New York, Jersey City, Hoboken).");
        setShowWhereDropdown(true);
      }
      return;
    }
    
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
      query: validLoc.name,
      dates: dates || undefined,
      maxPrice: undefined,
      language: undefined,
      teamPreference: teamPreference || undefined,
      guests: guests
    });
  };

  const handleLocationSelect = (cityName: string) => {
    setQuery(cityName);
    setShowWhereDropdown(false);
  };

  const filteredLocations = query.trim() === ""
    ? VALID_LOCATIONS
    : VALID_LOCATIONS.filter(loc => 
        loc.display.toLowerCase().includes(query.toLowerCase()) || 
        loc.searchTerms.some(term => term.includes(query.toLowerCase()))
      );

  const filteredTeams = teamPreference.trim() === ""
    ? WORLD_CUP_TEAMS
    : WORLD_CUP_TEAMS.filter(t => 
        t.name.toLowerCase().includes(teamPreference.toLowerCase()) ||
        t.code.toLowerCase().includes(teamPreference.toLowerCase())
      );

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-center bg-card border border-border rounded-2xl md:rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-300 w-full"
      >
        {/* Segment 1: Where */}
        <div ref={whereRef} className="flex-grow w-full md:w-auto px-6 py-2 border-b md:border-b-0 md:border-r border-border flex flex-col items-start gap-0.5 relative">
          <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Where</label>
          <input
            type="text"
            value={query}
            onFocus={() => {
              setShowWhereDropdown(true);
              setShowTeamDropdown(false);
              setShowGuestsDropdown(false);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowWhereDropdown(true);
            }}
            placeholder="Search by city or landmark"
            className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/75 font-semibold"
          />
          {showWhereDropdown && (
            <div className="absolute top-full left-0 mt-3 bg-card border border-border rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1 w-72 max-h-64 overflow-y-auto animate-float-quick">
              <span className="text-[10px] font-black text-muted-foreground uppercase px-2.5 py-1 tracking-wider">Tournament Locations</span>
              <div className="h-px bg-border/40 my-1" />
              {filteredLocations.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 font-medium text-center">
                  No matching host cities found.
                </div>
              ) : (
                filteredLocations.map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleLocationSelect(loc.name)}
                    className="flex items-center gap-3 px-3 py-2 text-left hover:bg-muted rounded-xl transition-colors cursor-pointer w-full group"
                  >
                    <span className="text-lg bg-muted group-hover:bg-background p-1.5 rounded-lg transition-colors">{loc.icon}</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">{loc.display}</span>
                      <span className="text-[9px] text-muted-foreground font-semibold leading-none mt-0.5">{loc.sub}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
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
        <div ref={teamRef} className="w-full md:w-40 px-6 py-2 border-b md:border-b-0 md:border-r border-border flex flex-col items-start gap-0.5 relative">
          <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Rooting For</label>
          <input
            type="text"
            value={teamPreference}
            onFocus={() => {
              setShowTeamDropdown(true);
              setShowWhereDropdown(false);
              setShowGuestsDropdown(false);
            }}
            onChange={(e) => {
              setTeamPreference(e.target.value);
              setShowTeamDropdown(true);
            }}
            placeholder="e.g. USA"
            className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/75 font-semibold"
          />
          {showTeamDropdown && (
            <div className="absolute top-full left-0 mt-3 bg-card border border-border rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1 w-56 max-h-64 overflow-y-auto animate-float-quick">
              <span className="text-[10px] font-black text-muted-foreground uppercase px-2.5 py-1 tracking-wider">Competing Teams</span>
              <div className="h-px bg-border/40 my-1" />
              {filteredTeams.length === 0 ? (
                <div className="text-xs text-muted-foreground p-3 font-medium text-center">
                  No matching teams found.
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <button
                    key={team.name}
                    type="button"
                    onClick={() => {
                      setTeamPreference(team.name);
                      setShowTeamDropdown(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted rounded-xl transition-colors cursor-pointer w-full font-bold text-xs text-foreground"
                  >
                    <span className="text-base">{team.flag}</span>
                    <span>{team.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Segment 4: Who */}
        <div ref={guestsRef} className="w-full md:w-40 px-6 py-2 flex items-center justify-between gap-1 relative">
          <div className="flex flex-col items-start gap-0.5 flex-grow">
            <label className="text-[10px] uppercase font-black tracking-wider text-foreground">Who</label>
            <button
              type="button"
              onClick={() => {
                setShowGuestsDropdown(!showGuestsDropdown);
                setShowWhereDropdown(false);
                setShowTeamDropdown(false);
              }}
              className="text-sm text-foreground/80 hover:text-foreground font-semibold bg-transparent border-0 p-0 text-left focus:outline-none"
            >
              {guests > 0 ? `${guests} guest${guests > 1 ? "s" : ""}` : "Add guests"}
            </button>
            
            {showGuestsDropdown && (
              <div className="absolute top-full left-0 mt-3 bg-card border border-border rounded-2xl shadow-xl p-4.5 z-50 flex flex-col gap-2 min-w-[170px] animate-float-quick">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Guests</span>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-foreground hover:bg-muted transition-colors"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm text-foreground">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(10, guests + 1))}
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center font-bold text-foreground hover:bg-muted transition-colors"
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
