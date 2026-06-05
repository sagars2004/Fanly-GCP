"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { Listing } from "../lib/agentClient";
import { Heart, Star, Clock, ShieldCheck } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { t } = useLanguage();
  const [liked, setLiked] = useState(false);

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const getFallbackPattern = (id: string) => {
    const hue = (hashString(id) % 360);
    return `linear-gradient(135deg, hsl(${hue}, 85%, 60%) 0%, hsl(${(hue + 60) % 360}, 85%, 40%) 100%)`;
  };

  const getRating = (id: string) => {
    return (4.5 + (hashString(id) % 5) / 10).toFixed(2);
  };
  
  const getReviewCount = (id: string) => {
    return (15 + (hashString(id) % 180));
  };

  return (
    <div className="group flex flex-col overflow-hidden select-none cursor-pointer">
      
      {/* Round-corner Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
        {listing.photos && listing.photos[0] && !listing.photos[0].startsWith("/images") ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
          />
        ) : (
          <div 
            style={{ backgroundImage: getFallbackPattern(listing.listing_id) }}
            className="h-full w-full flex flex-col items-center justify-center text-white p-4 relative"
          >
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
            <span className="text-3xl font-black opacity-30 select-none tracking-widest uppercase">
              {listing.location.city}
            </span>
          </div>
        )}

        {/* Heart Icon - Top Right */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked(!liked);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/25 text-white transition-all cursor-pointer z-10"
        >
          <Heart 
            className={`w-5 h-5 transition-transform duration-200 active:scale-75 ${
              liked ? "fill-primary text-primary" : "text-white"
            }`} 
            style={{ strokeWidth: 2 }}
          />
        </button>

        {/* Badge - Top Left */}
        <div className="absolute top-3 left-3 bg-white text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm z-10">
          {listing.host_verified ? "Verified" : "Original"}
        </div>

        {/* Distance Badge - Bottom Left */}
        <div className="absolute bottom-3 left-3 bg-black/50 text-white backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 z-10">
          <Clock className="w-3 h-3 text-primary" />
          <span>{listing.stadium_distances.metlife_minutes} min to MetLife</span>
        </div>
      </div>

      {/* Info Details Container */}
      <div className="pt-2 flex flex-col gap-1">
        
        {/* Title */}
        <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {/* Location & Languages */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>{listing.location.city}, {listing.location.state}</span>
          <div className="flex gap-1 text-[9px] uppercase font-bold text-muted-foreground">
            {listing.languages_spoken.slice(0, 2).map((lang) => (
              <span key={lang} className="bg-muted px-1.5 py-0.5 rounded">
                {lang}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30 mt-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-black text-foreground">${listing.pricing.price_per_night}</span>
            <span className="text-[10px] text-muted-foreground">/ night</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs font-bold text-foreground">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{getRating(listing.listing_id)}</span>
            <span className="text-muted-foreground text-[10px] font-normal">({getReviewCount(listing.listing_id)})</span>
          </div>
        </div>

        {/* Request Stay CTA button */}
        <Link
          href={`/listings/${listing.listing_id}`}
          className="mt-2 text-center py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs rounded-lg transition-colors shadow-sm"
        >
          {t("requestStay")}
        </Link>
        
      </div>
      
    </div>
  );
}
