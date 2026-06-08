"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { ShieldAlert, Trophy, X, UserPlus, LogIn, Lock } from "lucide-react";

export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, register, loginWithCredentials } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");
  
  // Sign Up Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupCode, setSignupCode] = useState("");
  
  // Log In Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Status states
  const [errorMsg, setErrorMsg] = useState("");

  if (!isLoginModalOpen) return null;

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim() || !signupEmail.trim() || !signupCode.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    if (signupCode.trim().length !== 6) {
      setErrorMsg("Passcode must be exactly 6 characters.");
      return;
    }

    try {
      const res = await register(firstName, lastName, signupEmail, signupCode);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to register.");
      } else {
        // Clear states
        setFirstName("");
        setLastName("");
        setSignupEmail("");
        setSignupCode("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register.");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }

    try {
      const res = await loginWithCredentials(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to log in.");
      } else {
        // Clear states
        setLoginEmail("");
        setLoginPassword("");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div 
        className="relative bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-float-quick"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Gold Accent Stripe at Top */}
        <div className="h-1.5 bg-gradient-to-r from-accent/70 via-accent to-accent/70 w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">
              World Cup Match Pass
            </h3>
          </div>
          <button
            onClick={() => {
              setIsLoginModalOpen(false);
              setErrorMsg("");
            }}
            className="p-1.5 border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-border bg-muted/10 p-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("signup");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "signup"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg("");
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "login"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Error Alert panel */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex gap-2 items-center text-xs text-destructive font-semibold">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body content */}
        <div className="p-6 overflow-y-auto">
          {activeTab === "signup" ? (
            /* Sign Up View */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block flex justify-between">
                  <span>6-Digit Passcode</span>
                  <span className="text-[9px] font-normal text-muted-foreground normal-case">e.g. 123456</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono font-bold tracking-widest text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm border border-primary/20 mt-4"
              >
                Register & Get Pass
              </button>
            </form>
          ) : (
            /* Log In View */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/30"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold rounded-lg text-xs uppercase tracking-wider transition-all shadow-sm border border-primary/20 mt-4"
              >
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
