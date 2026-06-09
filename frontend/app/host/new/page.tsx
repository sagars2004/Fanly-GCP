"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
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
  const { user, loginWithCredentials, logout } = useAuth();

  // Host Login / Verification State
  const [hostEmail, setHostEmail] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleHostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsVerifying(true);
    try {
      const result = await loginWithCredentials(hostEmail, hostPassword);
      if (!result.success) {
        setAuthError(result.error || "Authentication failed.");
      } else {
        const stored = localStorage.getItem("fanly-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.role !== "host") {
            logout();
            setAuthError("Access Denied: The authenticated profile is a Fan/Guest account. You must log in with a verified Host account.");
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate.");
    } finally {
      setIsVerifying(false);
    }
  };

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
        host_id: user?.id || "host_sagarsahu",
        host_name: user?.name || "Sagar Sahu",
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

  if (!user || user.role !== "host") {
    return (
      <div className="flex-grow bg-background py-12 px-4 md:px-8 flex items-center justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
          
          {/* Accent decoration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />

          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-foreground tracking-tight uppercase">
              Host Verification Required
            </h2>
            <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto">
              For regulatory and security compliance, you must verify Host Credentials before submitting accommodations.
            </p>
          </div>

          <form onSubmit={handleHostLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Host Email Address</label>
              <input
                type="email"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                placeholder="Please enter your Fanly username/email"
                className="w-full px-3 py-2.5 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Password / Passcode</label>
              <input
                type="password"
                value={hostPassword}
                onChange={(e) => setHostPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold text-sm"
                required
              />
            </div>

            {authError && (
              <p className="text-xs font-bold text-red-500 bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 leading-relaxed text-center">
                ⚠️ {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-white"
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Verify Credentials</span>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

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
