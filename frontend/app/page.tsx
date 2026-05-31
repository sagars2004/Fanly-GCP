"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { fetchListings, Listing, Match } from "../lib/agentClient";
import SearchBar from "../components/SearchBar";
import ListingCard from "../components/ListingCard";
import AgentChat from "../components/AgentChat";
import MatchScheduleOverlay from "../components/MatchScheduleOverlay";
import { Sparkles, HelpCircle, ShieldAlert, Award } from "lucide-react";

export default function Home() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<any>(null);
  
  // Load initial listings on mount
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      try {
        const data = await fetchListings();
        setListings(data);
      } catch (err) {
        console.error("Failed to load listings", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  const handleSearch = async (params: {
    query: string;
    dates?: string;
    maxPrice?: number;
    language?: string;
    teamPreference?: string;
  }) => {
    setIsLoading(true);
    setSearchParams(params);
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
  };

  return (
    <div className="flex-grow hero-gradient px-4 md:px-8 py-6 md:py-12">
      <div className="mx-auto max-w-7xl space-y-8 md:space-y-12">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider animate-float">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Elastic Partner Track Hackathon Entry</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-none text-balance">
            {t("heroTitle")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Local Law 18 Regulatory Alert */}
        <div className="max-w-4xl mx-auto p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex gap-3 items-start shadow-sm">
          <ShieldAlert className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-foreground/80 font-semibold leading-relaxed">
            {t("warningLL18")}
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />

        {/* Main Interface Layout: Listings Feed + AI Chat side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Listings Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contextual overlay matches if search dates exist */}
            {searchParams?.dates && (
              <MatchScheduleOverlay 
                checkIn={searchParams.dates.split(" to ")[0]} 
                checkOut={searchParams.dates.split(" to ")[1] || searchParams.dates} 
              />
            )}

            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-lg md:text-xl font-extrabold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                <span>{searchParams ? t("recommendationTitle") : "Featured World Cup Listings"}</span>
              </h2>
              <span className="text-xs font-bold text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-full">
                {listings.length} {t("resultsCount")}
              </span>
            </div>

            {isLoading ? (
              // Loading Grid Skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse h-[340px]">
                    <div className="aspect-[4/3] bg-muted w-full" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-8 bg-muted rounded w-full pt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              // No Results Found State
              <div className="text-center py-16 px-4 border border-dashed rounded-2xl bg-card/30">
                <span className="text-4xl">🏟️</span>
                <h3 className="font-extrabold text-lg text-foreground mt-4">No matching rooms found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                  Try widening your dates, adjusting your max budget slider, or typing a different query in the chat helper on the right!
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

          {/* Right Column: AI Agent Chat */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <AgentChat onMatchesFound={handleMatchesFound} />
          </div>

        </div>

      </div>
    </div>
  );
}
