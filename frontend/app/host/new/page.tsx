"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { createListing } from "@/lib/agentClient";
import { ArrowLeft, Home, Sparkles, MapPin, Globe, CheckCircle, ShieldAlert, Award } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const AMENITIES_LIST = [
  "WiFi", "Air Conditioning", "Kitchen", "Shared Bath", "Private Bath", 
  "Parking", "Washing Machine", "TV", "Coffee Maker", "Halal Food Nearby"
];

const TEAMS_LIST = ["All", "Brazil", "Argentina", "USA", "England", "Spain", "Morocco", "France", "Germany"];
const LANGUAGES_LIST = ["English", "Spanish", "Portuguese", "French", "Arabic"];

const WORLD_CUP_DATES = [
  "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19",
  "2026-06-20", "2026-06-21", "2026-06-22", "2026-06-23", "2026-06-24", "2026-06-25"
];

export default function BecomeHost() {
  const router = useRouter();
  const { t } = useLanguage();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NJ");
  const [zip, setZip] = useState("");
  const [pricePerNight, setPricePerNight] = useState(80);
  const [cleaningFee, setCleaningFee] = useState(15);
  const [maxGuests, setMaxGuests] = useState(2);
  const [houseRules, setHouseRules] = useState("");

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["WiFi"]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(["All"]);
  const [selectedDates, setSelectedDates] = useState<string[]>(["2026-06-18", "2026-06-19", "2026-06-20"]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleLanguage = (name: string) => {
    setSelectedLanguages(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleTeam = (name: string) => {
    setSelectedTeams(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(x => x !== date) : [...prev, date]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !address || !city || !zip) {
      alert("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createListing({
        host_id: "host_maria", // Mock host
        host_name: "Maria Silva", // Mock host name
        title,
        description,
        address,
        city,
        state,
        zip,
        lat: 40.7455 + (Math.random() - 0.5) * 0.05, // Seed mock coords
        lon: -74.1568 + (Math.random() - 0.5) * 0.05,
        price_per_night: pricePerNight,
        cleaning_fee: cleaningFee,
        max_guests: maxGuests,
        house_rules: houseRules,
        amenities: selectedAmenities,
        languages_spoken: selectedLanguages,
        team_welcome: selectedTeams,
        availability_dates: selectedDates,
        currency: "USD"
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow bg-background py-6 md:py-10 px-4 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Navigation Breadcrumb */}
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-extrabold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="space-y-2 border-b pb-4">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Home className="w-8 h-8 text-primary" />
            {t("createListingTitle")}
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            {t("becomeHostSub")}
          </p>
        </div>

        {/* Local Law Warning Banner */}
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex gap-3 items-start">
          <ShieldAlert className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-xs text-foreground/80 font-semibold leading-relaxed space-y-1">
            <p>{t("warningLL18")}</p>
            <p className="text-[10px] text-muted-foreground/80">Hosting in NYC/NJ during the World Cup is structured as a cultural hosting hospitality arrangement. Full properties listed in New York City are subject to OSE registry checks.</p>
          </div>
        </div>

        {/* Listing Form */}
        <form onSubmit={handleSubmit} className="space-y-8 bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          
          {/* General info */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-lg text-foreground border-b pb-1.5">1. Listing Overview</h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t("propertyTitle")} *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spacious Harrison Bedroom - 12 Mins walk from MetLife PATH"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t("propertyDesc")} *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Welcome international fans to your home! Describe the room, your household layout, and close transit lines."
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm h-32"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Max Guest Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">House Rules (e.g. noise limits)</label>
                <input
                  type="text"
                  value={houseRules}
                  onChange={(e) => setHouseRules(e.target.value)}
                  placeholder="e.g. Quiet after 11 PM. Celebrations welcome! No smoking."
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                />
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-extrabold text-lg text-foreground border-b pb-1.5 flex items-center gap-1">
              <MapPin className="w-5 h-5 text-secondary" />
              <span>2. Location</span>
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">{t("propertyAddress")} *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 102 Harrison Avenue"
                className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("city")} *</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Harrison"
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("state")} *</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="NJ"
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Zip *</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="07029"
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Languages & Teams cultural filters */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-extrabold text-lg text-foreground border-b pb-1.5 flex items-center gap-1">
              <Globe className="w-5 h-5 text-accent" />
              <span>3. Cultural Alignment & Communication</span>
            </h3>

            {/* Languages check grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase block">{t("language")}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {LANGUAGES_LIST.map((lang) => (
                  <label key={lang} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted cursor-pointer text-xs font-bold select-none text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => toggleLanguage(lang)}
                      className="accent-primary"
                    />
                    <span>{lang}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Welcome Teams check grid */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase block">Preferred Welcome Teams</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {TEAMS_LIST.map((team) => (
                  <label key={team} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted cursor-pointer text-xs font-bold select-none text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(team)}
                      onChange={() => toggleTeam(team)}
                      className="accent-primary"
                    />
                    <span>{team}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing with AI assistant suggestion */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-extrabold text-lg text-foreground border-b pb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>4. Booking Rates & Dates</span>
            </h3>

            {/* Price values inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">{t("priceLabel")} *</label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Cleaning Fee (USD)</label>
                <input
                  type="number"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                />
              </div>
            </div>

            {/* AI Assistant suggest badge block */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-1 flex gap-3.5 items-start">
              <Award className="w-6 h-6 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-primary uppercase tracking-wider">{t("pricingAssistant")}</h4>
                <p className="text-xs text-foreground/80 font-medium leading-normal">
                  {t("pricingAssistantText")} Setting a moderate rate welcomes budget-conscious international supporters and conforms to cultural exchange guidelines.
                </p>
              </div>
            </div>

            {/* Availability Date Check grid */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-muted-foreground uppercase block">{t("availabilityCal")}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {WORLD_CUP_DATES.map((date) => (
                  <label key={date} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:bg-muted cursor-pointer text-xs font-semibold select-none text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedDates.includes(date)}
                      onChange={() => toggleDate(date)}
                      className="accent-primary"
                    />
                    <span>{date.split("-").slice(1).join("/")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-xl text-sm transition-all disabled:opacity-50 shadow-md flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("submitListing")}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
