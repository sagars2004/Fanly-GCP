"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { fetchListingById, createBookingRequest, Listing } from "@/lib/agentClient";
import MatchScheduleOverlay from "@/components/MatchScheduleOverlay";
import { ArrowLeft, MapPin, ShieldCheck, Clock, Calendar, Users, CheckCircle, Check } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function ListingDetail() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useLanguage();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Booking Drawer State
  const [checkIn, setCheckIn] = useState("2026-06-18");
  const [checkOut, setCheckOut] = useState("2026-06-21");
  const [guests, setGuests] = useState(2);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadListing() {
      setIsLoading(true);
      try {
        const data = await fetchListingById(id);
        setListing(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadListing();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-muted-foreground">Retrieving listing details...</span>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <span className="text-4xl">🔎</span>
        <h3 className="font-extrabold text-lg text-foreground mt-4">Listing not found</h3>
        <Link href="/" className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm">
          Back to Search
        </Link>
      </div>
    );
  }

  // Calculate pricing breakdown
  const nights = Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ) || 1
  );
  
  const stayCost = listing.pricing.price_per_night * nights;
  const totalCost = stayCost + listing.pricing.cleaning_fee;

  const handleBookingRequest = async () => {
    setIsSubmitting(true);
    try {
      await createBookingRequest({
        listing_id: listing.listing_id,
        host_id: listing.host_id,
        fan_id: "fan_carlos", // Mock authenticated user
        fan_name: "Carlos Silva", // Mock authenticated guest
        check_in: checkIn,
        check_out: checkOut,
        guests: guests,
        total_price: totalCost
      });
      
      setBookingSuccess(true);
      
      // Trigger gorgeous confetti explosion
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFallbackPattern = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 85%, 60%) 0%, hsl(${(hue + 60) % 360}, 85%, 40%) 100%)`;
  };

  return (
    <div className="flex-grow bg-background py-6 md:py-10 px-4 md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Listings</span>
        </Link>

        {/* Visual Banner */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-muted h-[240px] md:h-[400px]">
          {listing.photos && listing.photos[0] ? (
            <img 
              src={listing.photos[0]} 
              alt={listing.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              style={{ backgroundImage: getFallbackPattern(listing.listing_id) }}
              className="w-full h-full flex flex-col items-center justify-center text-white p-6 relative"
            >
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest">{listing.location.city}</h2>
              <span className="text-xs uppercase tracking-widest font-black bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md mt-3">
                FIFA World Cup 2026 Housing Exchange
              </span>
            </div>
          )}

          {/* Location details overlay */}
          <div className="absolute bottom-4 left-4 bg-background/90 dark:bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs md:text-sm font-bold border border-border shadow-sm flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-primary" />
            <span>{listing.location.address}, {listing.location.city}, {listing.location.state}</span>
          </div>
        </div>

        {/* Layout details split column */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Details Content */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
                {listing.title}
              </h1>

              {/* Host and Distance Badges */}
              <div className="flex items-center gap-4 flex-wrap pb-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                    {listing.host_name.split(" ")[0][0]}
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-foreground flex items-center gap-1">
                      <span>{listing.host_name}</span>
                      {listing.host_verified && <ShieldCheck className="w-4 h-4 text-secondary fill-secondary/10" />}
                    </h5>
                    <span className="text-xs text-muted-foreground font-semibold">Verified Host</span>
                  </div>
                </div>

                <div className="h-6 w-[1px] bg-border hidden sm:block" />

                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground font-bold">
                  <Clock className="w-4.5 h-4.5 text-primary" />
                  <span>{listing.stadium_distances.metlife_minutes} min to MetLife Stadium ({listing.stadium_distances.metlife_transit_mode})</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">About the space</h4>
                <p className="text-sm md:text-base leading-relaxed text-foreground/80 font-medium whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>

              {/* Amenities */}
              <div className="space-y-2.5 pt-4 border-t">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">{t("amenities")}</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.amenities.map((item) => (
                    <span key={item} className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-lg font-bold border border-border/80 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-secondary" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* House Rules */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">{t("houseRules")}</h4>
                <div className="p-4 rounded-xl border bg-muted/30 text-xs md:text-sm leading-relaxed text-foreground/80 font-medium">
                  {listing.house_rules}
                </div>
              </div>
            </div>

          </div>

          {/* Right Booking Request Calculator Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Contextual Overlay Widget */}
            <MatchScheduleOverlay checkIn={checkIn} checkOut={checkOut} />

            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              
              {/* Form header */}
              <div className="flex justify-between items-baseline border-b pb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">${listing.pricing.price_per_night}</span>
                  <span className="text-xs text-muted-foreground font-bold">/ night</span>
                </div>
                <span className="text-xs text-primary font-bold">World Cup Available</span>
              </div>

              {bookingSuccess ? (
                // Success Confirmation panel
                <div className="text-center py-6 space-y-4 animate-float-quick">
                  <CheckCircle className="w-12 h-12 text-secondary mx-auto" />
                  <h4 className="font-extrabold text-lg text-foreground">{t("bookingReqTitle")} Sent!</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("successMsg")}
                  </p>
                  <button 
                    onClick={() => router.push("/dashboard")}
                    className="w-full py-3 bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold rounded-xl text-sm transition-all"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                // Checkout Form
                <div className="space-y-4">
                  {/* Date Pickers */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase">{t("checkIn")}</label>
                      <input 
                        type="date"
                        value={checkIn}
                        min="2026-06-10"
                        max="2026-07-25"
                        onChange={(e) => setCheckIn(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase">{t("checkOut")}</label>
                      <input 
                        type="date"
                        value={checkOut}
                        min={checkIn}
                        max="2026-07-25"
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      />
                    </div>
                  </div>

                  {/* Guests selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase">{t("numGuests")}</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                    >
                      {[...Array(listing.max_guests)].map((_, i) => (
                        <option key={i+1} value={i+1}>{i+1} guest{i > 0 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-4 border-t space-y-2.5">
                    <h5 className="font-extrabold text-xs text-muted-foreground uppercase tracking-wider">{t("priceDetails")}</h5>
                    
                    <div className="flex justify-between text-xs font-semibold text-foreground/80">
                      <span>${listing.pricing.price_per_night} x {nights} night{nights > 1 ? "s" : ""}</span>
                      <span>${stayCost} USD</span>
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-foreground/80">
                      <span>{t("cleaningFee")}</span>
                      <span>${listing.pricing.cleaning_fee} USD</span>
                    </div>

                    <div className="flex justify-between text-sm font-extrabold text-foreground pt-2 border-t">
                      <span>{t("total")}</span>
                      <span>${totalCost} USD</span>
                    </div>
                  </div>

                  {/* CTA Request button */}
                  <button
                    onClick={handleBookingRequest}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-xl text-sm transition-all disabled:opacity-50 mt-2 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>{t("requestStay")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
