import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Feather, Heart, Compass, Shield, Flame, BookOpen } from 'lucide-react';
import { Quote } from '../types';

interface QuoteSanctuaryProps {
  onQuoteChange?: (quote: Quote) => void;
}

const THEME_ICONS: Record<string, React.FC<{ className?: string }>> = {
  faith: Sparkles,
  wisdom: Compass,
  healing: Heart,
  truth: BookOpen,
  hope: Feather,
  courage: Shield,
  purpose: Flame,
};

export const QuoteSanctuary: React.FC<QuoteSanctuaryProps> = () => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [quoteHistory, setQuoteHistory] = useState<string[]>([]);

  // Fetch initial quote
  const fetchRandomQuote = async (isManual = false) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/quotes/random');
      const data = await res.json();
      if (data.quote) {
        setCurrentQuote(data.quote);
        setQuoteHistory((prev) => [data.quote.id, ...prev.slice(0, 10)]);
      }
    } catch (e) {
      console.error('Failed to fetch quote:', e);
    } finally {
      setIsLoading(false);
      setSecondsRemaining(60);
    }
  };

  const handleRequestNewQuote = async () => {
    setIsLoading(true);
    try {
      const themes = ['faith', 'wisdom', 'healing', 'truth', 'hope', 'courage', 'purpose'];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const res = await fetch('/api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: randomTheme }),
      });
      const data = await res.json();
      if (data.quote) {
        setCurrentQuote(data.quote);
        setSecondsRemaining(60);
      }
    } catch (e) {
      await fetchRandomQuote(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomQuote();
  }, []);

  // 60-second rotation countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          fetchRandomQuote();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const IconComponent = currentQuote ? THEME_ICONS[currentQuote.theme] || Sparkles : Sparkles;

  return (
    <div className="relative max-w-3xl mx-auto w-full px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#25103f]/70 via-[#18092d]/90 to-[#0e051c]/95 border border-[#d4af37]/35 p-6 sm:p-8 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#6b2ca7]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top header row of Quote card */}
        <div className="flex items-center justify-between text-xs mb-4 pb-3 border-b border-[#d4af37]/15">
          <div className="flex items-center gap-2 text-[#e5c158]">
            <IconComponent className="w-4 h-4 text-[#ffd700]" />
            <span className="font-medium uppercase tracking-widest text-[11px]">
              Contemplative Sanctuary · {currentQuote ? currentQuote.theme : 'Wisdom'}
            </span>
          </div>

          {/* 60s Countdown indicator */}
          <div className="flex items-center gap-2 text-[#a8997a]">
            <span className="text-[10px] uppercase tracking-wider hidden sm:inline">Refreshes in</span>
            <div className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#f3d46d] bg-[#120722] px-2 py-0.5 rounded border border-[#d4af37]/20">
              <span>{secondsRemaining}s</span>
            </div>
          </div>
        </div>

        {/* Quote Prose */}
        <div className="min-h-[90px] flex items-center justify-center py-2 text-center">
          <p
            className={`font-serif-display text-lg sm:text-xl lg:text-2xl text-[#f7f2ea] leading-relaxed italic transition-opacity duration-300 ${
              isLoading ? 'opacity-40' : 'opacity-100'
            }`}
          >
            "{currentQuote?.text || 'When faith takes root in the quiet unseen places of the heart, no gale of circumstance can uproot your purpose.'}"
          </p>
        </div>

        {/* Attribution & Controls */}
        <div className="mt-5 pt-3 border-t border-[#d4af37]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-[#c9b78e]/80 tracking-wide italic">
            — Original Contemplation · Heartwoven Wonders
          </span>

          <button
            onClick={handleRequestNewQuote}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#311452] hover:bg-[#431b6e] text-[#ffd700] hover:text-[#fff] border border-[#d4af37]/35 transition-all text-xs font-medium cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title="Request another quote immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Request Another Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
};
