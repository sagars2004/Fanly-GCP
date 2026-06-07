"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";
import { Globe } from "lucide-react";

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-muted/40 border-t border-border/50 text-foreground/80 mt-16 select-none">
      <div className="mx-auto max-w-7xl px-6 md:px-12 py-10 space-y-8">
        
        {/* Footer Top Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-border/40 text-xs md:text-sm">
          {/* Support Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-foreground tracking-wider uppercase text-[10px]">Support</h4>
            <ul className="space-y-2.5 font-semibold text-muted-foreground">
              <li><Link href="#" className="hover:underline hover:text-foreground">Help Center</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Fanly Cover</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Anti-discrimination</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Disability Support</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Cancellation Options</Link></li>
            </ul>
          </div>

          {/* Community Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-foreground tracking-wider uppercase text-[10px]">Community</h4>
            <ul className="space-y-2.5 font-semibold text-muted-foreground">
              <li><Link href="#" className="hover:underline hover:text-foreground">World Cup Fan Hubs</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Local Host Forums</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Cultural Exchange Tips</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Jersey City Host Association</Link></li>
            </ul>
          </div>

          {/* Hosting Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-foreground tracking-wider uppercase text-[10px]">Hosting</h4>
            <ul className="space-y-2.5 font-semibold text-muted-foreground">
              <li><Link href="/host/new" className="hover:underline hover:text-foreground">Become a Host</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Regulatory Guidelines (LL18)</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Host Resources</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">P2P Contract Templates</Link></li>
            </ul>
          </div>

          {/* Hackathon Column */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-foreground tracking-wider uppercase text-[10px]">Project</h4>
            <ul className="space-y-2.5 font-semibold text-muted-foreground">
              <li><Link href="#" className="hover:underline hover:text-foreground">Elastic partner track info</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Google Cloud Agent Builder</Link></li>
              <li><Link href="#" className="hover:underline hover:text-foreground">Gemini Model Grounding</Link></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:underline hover:text-foreground flex items-center gap-1">
                <span>GitHub Repository</span>
                <svg className="w-3.5 h-3.5 inline text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 text-xs font-semibold text-muted-foreground">
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <span>© {currentYear} Fanly, Inc.</span>
            <span>•</span>
            <Link href="#" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link href="#" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link href="#" className="hover:underline">Sitemap</Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 cursor-pointer hover:underline text-foreground">
              <Globe className="w-4 h-4" />
              <span>English (US)</span>
            </div>
            <div className="cursor-pointer hover:underline text-foreground">
              <span>$ USD</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
