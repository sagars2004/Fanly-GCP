"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { fetchBookings, updateBookingStatus, fetchContract, Booking, Listing } from "@/lib/agentClient";
import { User, ClipboardList, ShieldCheck, FileText, CheckCircle, XCircle, Calendar, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, setIsLoginModalOpen } = useAuth();
  const [activeTab, setActiveTab] = useState<"fan" | "host">("fan");
  
  // Bookings list state
  const [fanBookings, setFanBookings] = useState<Booking[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Contract Modal State
  const [selectedBookingContract, setSelectedBookingContract] = useState<string | null>(null);
  const [contractText, setContractText] = useState("");
  const [isLoadingContract, setIsLoadingContract] = useState(false);

  async function loadDashboardData() {
    if (!user) return;
    setIsLoading(true);
    try {
      const fanData = await fetchBookings(user.id, "fan");
      const hostData = await fetchBookings(user.id, "host");
      setFanBookings(fanData);
      setHostBookings(hostData);
    } catch (err) {
      console.error("Dashboard error loading data", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      setActiveTab(user.role);
      loadDashboardData();
    }
  }, [user]);

  const handleAcceptRequest = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, "accepted");
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#6200EA", "#00E5FF", "#FFD600"]
      });
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Failed to accept booking.");
    }
  };

  const handleDeclineRequest = async (bookingId: string) => {
    if (!confirm("Are you sure you want to decline this request?")) return;
    try {
      await updateBookingStatus(bookingId, "cancelled");
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert("Failed to decline booking.");
    }
  };

  const handleViewContract = async (bookingId: string) => {
    setSelectedBookingContract(bookingId);
    setIsLoadingContract(true);
    try {
      const data = await fetchContract(bookingId);
      setContractText(data.contract_text);
    } catch (err) {
      console.error(err);
      setContractText("Failed to retrieve contract. Please try again.");
    } finally {
      setIsLoadingContract(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "requested":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "accepted":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "requested":
        return t("statusRequested");
      case "accepted":
        return t("statusAccepted");
      case "confirmed":
        return t("statusConfirmed");
      case "cancelled":
        return t("statusCancelled");
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto space-y-4 my-20 animate-float-quick select-none">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Dashboard Locked</h2>
        <p className="text-xs text-muted-foreground font-bold leading-relaxed">
          {t("loginRequired") || "Please sign in to manage bookings, approve requests, and generate host-guest exchange agreements."}
        </p>
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm border border-primary/20 w-full"
        >
          {t("login") || "Log In"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-background py-6 md:py-10 px-4 md:px-8 select-none">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Title */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{t("dashboardTitle")}</h1>
            <p className="text-xs text-muted-foreground font-semibold">Manage bookings, accept hosting requests, and download cultural exchange contracts.</p>
          </div>
          <button 
            onClick={loadDashboardData}
            className="p-2 border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-border bg-card p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("fan")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "fan"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{t("dashboardFanTab")}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("host")}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "host"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>{t("dashboardHostTab")}</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {isLoading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Fan Tab Content */}
            {activeTab === "fan" && (
              <div className="space-y-4">
                {fanBookings.length === 0 ? (
                  <div className="text-center py-16 border rounded-2xl bg-card/30">
                    <span className="text-3xl">✈️</span>
                    <h3 className="font-extrabold text-foreground mt-2">{t("noBookings")}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Book your first World Cup accommodation stay from the search panel.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fanBookings.map((booking) => (
                      <div key={booking.booking_id} className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Stay dates</span>
                            <h4 className="font-extrabold text-sm md:text-base text-foreground mt-0.5 flex items-center gap-1">
                              <Calendar className="w-4.5 h-4.5 text-primary shrink-0" />
                              <span>{booking.dates.check_in} to {booking.dates.check_out}</span>
                            </h4>
                          </div>
                          
                          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${getStatusStyle(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="space-y-1.5 border-t border-border/50 pt-3">
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Booking ID:</span>
                            <span className="font-bold text-foreground">{booking.booking_id}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Guests:</span>
                            <span className="font-bold text-foreground">{booking.guests} traveler{booking.guests > 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Total cost:</span>
                            <span className="font-bold text-foreground">${booking.total_price} USD</span>
                          </div>
                        </div>

                        {/* View Contract Button if accepted */}
                        {booking.status === "accepted" && (
                          <button
                            onClick={() => handleViewContract(booking.booking_id)}
                            className="w-full py-2 bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1 border border-secondary/20 shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{t("viewContract")}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Host Tab Content */}
            {activeTab === "host" && (
              <div className="space-y-4">
                {hostBookings.length === 0 ? (
                  <div className="text-center py-16 border rounded-2xl bg-card/30">
                    <span className="text-3xl">🏠</span>
                    <h3 className="font-extrabold text-foreground mt-2">{t("noBookings")}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Pending hosting requests from international fans will appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hostBookings.map((booking) => (
                      <div key={booking.booking_id} className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Guest details</span>
                            <h4 className="font-extrabold text-sm md:text-base text-foreground mt-0.5">
                              {booking.fan_name}
                            </h4>
                            <span className="text-xs text-muted-foreground font-semibold">{booking.dates.check_in} to {booking.dates.check_out}</span>
                          </div>
                          
                          <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${getStatusStyle(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="space-y-1.5 border-t border-border/50 pt-3">
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Booking ID:</span>
                            <span className="font-bold text-foreground">{booking.booking_id}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Guests count:</span>
                            <span className="font-bold text-foreground">{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex justify-between text-xs font-semibold text-foreground/80">
                            <span>Payout:</span>
                            <span className="font-extrabold text-foreground">${booking.total_price} USD</span>
                          </div>
                        </div>

                        {/* Accept / Decline actions if requested */}
                        {booking.status === "requested" && (
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <button
                              onClick={() => handleAcceptRequest(booking.booking_id)}
                              className="py-2 bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{t("accept")}</span>
                            </button>
                            <button
                              onClick={() => handleDeclineRequest(booking.booking_id)}
                              className="py-2 bg-background hover:bg-muted text-muted-foreground hover:text-foreground font-extrabold rounded-lg text-xs border transition-all flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t("decline")}</span>
                            </button>
                          </div>
                        )}

                        {/* View Contract Button if accepted */}
                        {booking.status === "accepted" && (
                          <button
                            onClick={() => handleViewContract(booking.booking_id)}
                            className="w-full py-2 bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold rounded-lg text-xs transition-all flex items-center justify-center gap-1 border border-secondary/20 shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{t("viewContract")}</span>
                          </button>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Contract Viewer Modal Overlay */}
      {selectedBookingContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-float-quick">
            
            {/* Modal Header */}
            <div className="p-4 bg-muted border-b flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" />
                <h4 className="font-extrabold text-sm md:text-base text-foreground">{t("contractTitle")}</h4>
              </div>
              <button
                onClick={() => {
                  setSelectedBookingContract(null);
                  setContractText("");
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider px-2 py-1 hover:bg-background rounded transition-colors"
              >
                {t("close")}
              </button>
            </div>

            {/* Modal Body scroll content */}
            <div className="flex-grow p-6 overflow-y-auto bg-background">
              {isLoadingContract ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground font-bold">Drafting agreement via Gemini...</span>
                </div>
              ) : (
                <div className="p-6 bg-card border shadow-sm rounded-xl font-mono text-xs md:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-w-full overflow-x-auto border-t-4 border-t-secondary relative select-text">
                  {/* Decorative stamp stamp */}
                  <div className="absolute top-4 right-4 border-2 border-dashed border-secondary/35 text-secondary/35 px-2.5 py-1 text-[9px] font-black uppercase rounded rotate-12 select-none pointer-events-none">
                    Verified Agreement
                  </div>
                  {contractText}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted border-t flex justify-end gap-2 shrink-0">
              <button
                onClick={() => alert("PDF download started! (Simulated)")}
                className="px-4 py-2 bg-secondary hover:bg-secondary/95 text-secondary-foreground font-extrabold rounded-lg text-xs transition-all shadow-sm"
              >
                {t("downloadContract")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
