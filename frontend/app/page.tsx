"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { fetchListings, Listing } from "../lib/agentClient";
import SearchBar from "../components/SearchBar";
import ListingCard from "../components/ListingCard";
import AgentChat from "../components/AgentChat";
import MatchScheduleOverlay from "../components/MatchScheduleOverlay";
import { Sparkles, ShieldAlert, Heart, Star } from "lucide-react";

interface Attraction {
  id: string;
  title: string;
  price: string;
  rating: string;
  reviews: string;
  image: string;
  badge?: string;
}

const JERSEY_ATTRACTIONS: Attraction[] = [
  {
    id: "att_1",
    title: "Step onto Edge sky deck Ticket Only",
    price: "From $48 / guest",
    rating: "4.44",
    reviews: "312",
    image: "https://images.unsplash.com/photo-1549643276-fdf2fab574f5?auto=format&fit=crop&w=400&h=300&q=80",
    badge: "Trending"
  },
  {
    id: "att_2",
    title: "Top of the Rock Timed Admission",
    price: "From $46 / guest",
    rating: "5.0",
    reviews: "420",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&h=300&q=80"
  },
  {
    id: "att_3",
    title: "Empire State Building 86th Main Deck Ticket",
    price: "From $48 / guest",
    rating: "4.92",
    reviews: "860",
    image: "https://images.unsplash.com/photo-1502104034360-73176bb1e92e?auto=format&fit=crop&w=400&h=300&q=80",
    badge: "Trending"
  },
  {
    id: "att_4",
    title: "Experience the New York Yankees at Yankee Stadium",
    price: "From $140 / guest",
    rating: "4.85",
    reviews: "1.2k",
    image: "https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=400&h=300&q=80"
  },
  {
    id: "att_5",
    title: "Skylift & Timed Admission - Top of the Rock",
    price: "From $63 / guest",
    rating: "4.78",
    reviews: "155",
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=400&h=300&q=80"
  },
  {
    id: "att_6",
    title: "Cruise NYC harbor & get up close to Lady Liberty",
    price: "From $20 / guest",
    rating: "4.96",
    reviews: "2.4k",
    image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=400&h=300&q=80"
  },
  {
    id: "att_7",
    title: "All-Inclusive Pass - Top of the Rock",
    price: "From $79 / guest",
    rating: "4.90",
    reviews: "480",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=400&h=300&q=80"
  }
];

export default function Home() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<any>(null);
  const [likedAttractions, setLikedAttractions] = useState<Record<string, boolean>>({});
  const [hasSearched, setHasSearched] = useState(false);

  // Load search state from sessionStorage on mount (client-side only)
  useEffect(() => {
    const savedListings = sessionStorage.getItem("saved_listings");
    const savedParams = sessionStorage.getItem("saved_search_params");
    const savedHasSearched = sessionStorage.getItem("saved_has_searched");

    if (savedHasSearched === "true") {
      setHasSearched(true);
      if (savedListings) {
        try {
          setListings(JSON.parse(savedListings));
        } catch (e) {
          console.error("Failed to parse saved listings", e);
        }
      }
      if (savedParams) {
        try {
          setSearchParams(JSON.parse(savedParams));
        } catch (e) {
          console.error("Failed to parse saved search params", e);
        }
      }
    }
  }, []);

  // Sync search state to sessionStorage whenever it changes
  useEffect(() => {
    if (hasSearched) {
      sessionStorage.setItem("saved_has_searched", "true");
      sessionStorage.setItem("saved_listings", JSON.stringify(listings));
      if (searchParams) {
        sessionStorage.setItem("saved_search_params", JSON.stringify(searchParams));
      }
    } else {
      sessionStorage.removeItem("saved_has_searched");
      sessionStorage.removeItem("saved_listings");
      sessionStorage.removeItem("saved_search_params");
    }
  }, [listings, searchParams, hasSearched]);

  const handleSearch = async (params: {
    query: string;
    dates?: string;
    maxPrice?: number;
    language?: string;
    teamPreference?: string;
    guests?: number;
  }) => {
    setIsLoading(true);
    setSearchParams(params);
    setHasSearched(true);

    // Persist team preference to localStorage
    if (params.teamPreference) {
      localStorage.setItem("team_rooting_for", params.teamPreference);
    } else {
      localStorage.removeItem("team_rooting_for");
    }

    try {
      const data = await fetchListings({
        query: params.query,
        dates: params.dates,
        max_price: params.maxPrice,
        languages: params.language,
        team_preference: params.teamPreference
      });
      setListings(data);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchesFound = (newListings: Listing[]) => {
    setListings(newListings);
    setHasSearched(true);
  };

  const toggleLikeAttraction = (id: string) => {
    setLikedAttractions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex-grow bg-background px-6 md:px-12 py-8 space-y-10">
      <div className="mx-auto max-w-7xl space-y-10">
        
        {/* Sparkles Hackathon Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider animate-float">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built by Sagar Sahu for the 2026 Google Cloud Rapid Agent Hackathon Elastic Partner Track</span>
          </div>
        </div>

        {/* Catchy Tagline */}
        <div className="text-center max-w-2xl mx-auto -mt-4">
          <p className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug">
            Where fans become{" "}
            <span className="text-primary">neighbors</span>
            {" "}for the world&apos;s biggest game. ⚽
          </p>
          <p className="text-sm text-muted-foreground font-medium mt-1.5">
            AI-matched, legally-protected home exchanges for FIFA World Cup 2026™ — in one search.
          </p>
        </div>

        {/* Floating Search Bar */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialParams={searchParams} />

        {/* Main Interface Layout: Feed Column + AI Agent Chat column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column: Listings Feed & Attractions Carousels */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Match Schedule contextual overlay */}
            {hasSearched && searchParams?.dates && (
              <MatchScheduleOverlay 
                checkIn={searchParams.dates.split(" to ")[0]} 
                checkOut={searchParams.dates.split(" to ")[1] || searchParams.dates} 
              />
            )}

            {/* SECTION 1: World Cup Listings Feed (Primary) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-2">
                  <span>⚽</span> Celebrate the FIFA World Cup 26™
                </h2>
                <span className="text-xs font-bold text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-full">
                  {listings.length} {t("resultsCount")}
                </span>
              </div>

              {!hasSearched ? (
                // Gated Initial State
                <div className="text-center py-16 border border-dashed border-border/80 rounded-2xl bg-card/40 backdrop-blur-md shadow-inner animate-fade-in space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto shadow-sm">
                    <span className="text-3xl animate-bounce">🏟️</span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-foreground uppercase tracking-wider">
                      Search World Cup Accommodations
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
                      Enter your travel location, dates, and number of guests in the search bar above to unlock matching hosts and FIFA matches.
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                // Skeleton Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="rounded-xl overflow-hidden animate-pulse space-y-3">
                      <div className="aspect-[4/3] bg-muted w-full rounded-xl" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-8 bg-muted rounded w-full pt-4" />
                    </div>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                // Empty state
                <div className="text-center py-12 border border-dashed rounded-xl bg-card/30">
                  <span className="text-3xl">🏟️</span>
                  <h3 className="font-black text-base text-foreground mt-4">No matching spaces found</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                    Try modifying dates, adjusting your filters, or chat with the AI helper on the right to matching listings!
                  </p>
                </div>
              ) : (
                // Listings Grid
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing.listing_id} listing={listing} />
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: Attractions Carousel (Secondary) */}
            <div className="space-y-4 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-black text-foreground">
                  Explore local attractions in Jersey City & NYC
                </h2>
                <span className="text-xs font-bold text-primary hover:underline cursor-pointer transition-colors">
                  View all →
                </span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none snap-x">
                {JERSEY_ATTRACTIONS.map((att) => (
                  <div key={att.id} className="min-w-[190px] max-w-[190px] snap-start flex flex-col gap-2">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted group cursor-pointer">
                      <img 
                        src={att.image} 
                        alt={att.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                      {att.badge && (
                        <div className="absolute top-2.5 left-2.5 bg-white text-black text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm z-10">
                          {att.badge}
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => toggleLikeAttraction(att.id)}
                        className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/10 text-white hover:bg-black/25 z-10 cursor-pointer"
                      >
                        <Heart 
                          className={`w-4 h-4 ${likedAttractions[att.id] ? "fill-primary text-primary" : "text-white"}`} 
                          style={{ strokeWidth: 2 }} 
                        />
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-0.5">
                      <h4 className="font-bold text-xs text-foreground line-clamp-1 leading-tight hover:text-primary transition-colors">
                        {att.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground/80">{att.price}</span>
                        <div className="flex items-center gap-0.5 text-foreground font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{att.rating}</span>
                          <span className="text-muted-foreground font-normal text-[9px]">({att.reviews})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: AI Agent Chat */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <AgentChat onMatchesFound={handleMatchesFound} />
          </div>

        </div>

      </div>
    </div>
  );
}
