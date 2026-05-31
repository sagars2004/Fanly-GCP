"use client";

import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../lib/LanguageContext";
import { sendChatMessage, ChatMessage, Listing } from "../lib/agentClient";
import { Send, Sparkles, MessageCircle, HelpCircle, User } from "lucide-react";
import Link from "next/link";

interface AgentChatProps {
  onMatchesFound?: (listings: Listing[]) => void;
}

export default function AgentChat({ onMatchesFound }: AgentChatProps) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Quick Chips Suggestion
  const SUGGESTION_CHIPS = {
    en: [
      "I need a place near MetLife for the Brazil vs Argentina match",
      "Looking for a quiet room under $80/night",
      "Are there any Portuguese speaking hosts?",
      "Show me listings for Morocco vs Spain on June 26"
    ],
    es: [
      "Busco un cuarto cerca de MetLife para el partido de Brasil",
      "Alojamiento por menos de $80 la noche",
      "¿Hay anfitriones que hablen español en Newark?",
      "Mostrar alojamientos para el partido de España el 26 de junio"
    ],
    pt: [
      "Preciso de um quarto perto do MetLife Stadium para o jogo do Brasil",
      "Quarto confortável abaixo de 80 dólares",
      "Tem algum anfitrião que fale português em Harrison?",
      "Opções para o jogo do Brasil dia 20 de junho"
    ],
    fr: [
      "Chambre près de MetLife pour le match du Brésil",
      "Logement à moins de 80$ la nuit",
      "Y a-t-il des hôtes qui parlent français à Manhattan?",
      "Hébergements pour le match du 26 juin"
    ],
    ar: [
      "أريد غرفة بالقرب من ملعب MetLife لمباراة البرازيل والأرجنتين",
      "أبحث عن سكن بسعر أقل من 80 دولار لليلة",
      "هل هناك مضيفون يتحدثون العربية في نيو جيرسي؟",
      "اعرض لي سكنًا لمباراة المغرب وإسبانيا في 26 يونيو"
    ]
  };

  const getChips = () => {
    return SUGGESTION_CHIPS[language] || SUGGESTION_CHIPS["en"];
  };

  useEffect(() => {
    // Auto-scroll chat
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(updatedMessages, language);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content }
      ]);
      
      // Notify parent of updated matching listings
      if (response.recommended_listings && onMatchesFound) {
        onMatchesFound(response.recommended_listings);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble reaching the AI matching server. Let me check the connection." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 animate-pulse text-accent" />
          <div>
            <h4 className="font-extrabold text-sm tracking-tight">{t("agentChatTitle")}</h4>
            <span className="text-[10px] text-primary-foreground/80 font-semibold uppercase">Powered by Gemini AI</span>
          </div>
        </div>
        <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">Agent</span>
      </div>

      {/* Messages Window */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[500px]">
        {/* Intro bubble */}
        <div className="flex gap-2.5 items-start">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold border border-primary/20">
            🤖
          </div>
          <div className="p-3 rounded-2xl rounded-tl-none bg-muted text-foreground text-sm leading-relaxed max-w-[85%] font-medium">
            {t("agentIntro")}
          </div>
        </div>

        {/* Dynamic chat messages */}
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex gap-2.5 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold border ${
              msg.role === "user" 
                ? "bg-secondary/10 text-secondary border-secondary/20" 
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : "🤖"}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap font-medium ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-muted text-foreground rounded-tl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold border border-primary/20">
              🤖
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-muted flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <div className="p-3 border-t border-border bg-background space-y-1.5">
          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            Quick World Cup Queries
          </span>
          <div className="flex flex-wrap gap-1.5">
            {getChips().map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip)}
                className="text-left text-xs bg-card hover:bg-muted text-foreground/80 hover:text-foreground font-semibold px-2.5 py-1.5 rounded-lg border border-border transition-colors truncate max-w-full"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 border-t border-border bg-card">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
            placeholder="Ask anything in your native language..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
          />
          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-1.5 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
