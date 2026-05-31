"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { Listing } from "../lib/agentClient";
import { MapPin, ShieldCheck, Check, Clock, Globe } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

const TEAM_FLAGS: Record<string, string> = {
  Brazil: "🇧🇷",
  Argentina: "🇦🇷",
  USA: "🇺🇸",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Spain: "🇪🇸",
  Morocco: "🇲🇦",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  Portugal: "🇵🇹",
  Mexico: "🇲🇽",
  Colombia: "🇨🇴"
};

export default function ListingCard({ listing }: ListingCardProps) {
  const { t } = useLanguage();

  const getFallbackPattern = (id: string) => {
    // Generate a beautiful, unique CSS gradient pattern as a premium fallback image
    const hue = (hashString(id) % 360);
    return `linear-gradient(135deg, hsl(${hue}, 85%, 60%) 0%, hsl(${(hue + 60) % 360}, 85%, 40%) 100%)`;
  };

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden card-hover-effect select-none">
      
      {/* Photo / Visual Banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {listing.photos && listing.photos[0] && !listing.photos[0].startsWith("/images") ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div 
            style={{ backgroundImage: getFallbackPattern(listing.listing_id) }}
            className="h-full w-full flex flex-col items-center justify-center text-white p-4 relative"
          >
            {/* Sporty visual overlay */}
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
            <span className="text-5xl font-black opacity-30 select-none tracking-widest uppercase">
              {listing.location.city}
            </span>
            <span className="text-xs uppercase tracking-widest font-black bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-md mt-2">
              World Cup Host
            </span>
          </div>
        )}

        {/* Floating Distance Badge */}
        <div className="absolute top-3 left-3 bg-background/90 dark:bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-foreground border border-border flex items-center gap-1 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{listing.stadium_distances.metlife_minutes} min to MetLife ({listing.stadium_distances.metlife_transit_mode})</span>
        </div>

        {/* Verified Host Floating Seal */}
        {listing.host_verified && (
          <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground dark:bg-emerald-600/90 dark:text-white backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t("hostVerified")}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
        
        <div className="space-y-2">
          {/* Geolocation Tag */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{listing.location.city}, {listing.location.state}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Languages spoken */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {t("hostLanguages")}:
            </span>
            {listing.languages_spoken.map((lang) => (
              <span key={lang} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-semibold">
                {lang}
              </span>
            ))}
          </div>

          {/* Welcomes Teams Section */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {t("teamWelcomeLabel")}:
            </span>
            <div className="flex gap-1">
              {listing.team_welcome.map((team) => (
                <span 
                  key={team} 
                  className="text-xs bg-accent/10 dark:bg-amber-500/10 text-accent dark:text-amber-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-accent/20"
                  title={`${team} fans welcome`}
                >
                  <span>{TEAM_FLAGS[team] || "⚽"}</span>
                  <span>{team}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-foreground">${listing.pricing.price_per_night}</span>
              <span className="text-xs text-muted-foreground">/ night</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-semibold">
              +${listing.pricing.cleaning_fee} cleaning fee
            </span>
          </div>

          <Link
            href={`/listings/${listing.listing_id}`}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs md:text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            {t("requestStay")}
          </Link>
        </div>

      </div>

    </div>
  );
}
