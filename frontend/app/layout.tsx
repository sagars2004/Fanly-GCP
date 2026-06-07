import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/LanguageContext";
import { AuthProvider } from "../lib/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoginModal from "../components/LoginModal";

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Fanly | World Cup 2026 Housing Exchange",
  description: "Find legal, affordable, peer-to-peer housing in New York and New Jersey for the FIFA World Cup 2026. Powered by AI search and contract matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <LoginModal />
            <main className="flex-grow flex flex-col">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
