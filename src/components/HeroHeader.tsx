import React from 'react';
import { GoldCrestOrnament, FiligreeDivider } from './Ornaments';
import { QuoteSanctuary } from './QuoteSanctuary';

interface HeroHeaderProps {
  onExploreBooks?: () => void;
  onExploreCollections?: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  onExploreBooks,
  onExploreCollections,
}) => {
  return (
    <header className="relative pt-10 pb-16 overflow-hidden bg-gradient-to-b from-[#140824] via-[#10061e] to-[#0d0517]">
      {/* Subtle royal background atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#411b6d]/25 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Main Bookstore Identity Framed by Two Large Elegant Ornaments */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 lg:gap-12 mb-4">
          {/* Left Large Decorative Ornament */}
          <div className="hidden md:block shrink-0">
            <GoldCrestOrnament className="w-20 h-20 lg:w-28 lg:h-28" />
          </div>

          {/* Central Title Lockup */}
          <div className="flex flex-col items-center">
            <h1 className="font-cinzel text-3xl sm:text-5xl lg:text-6xl font-bold tracking-widest text-[#ffd700] drop-shadow-md">
              HEARTWOVEN WONDERS
            </h1>
            <div className="mt-2.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm uppercase tracking-[0.25em] text-[#e6d8ba] font-light">
              <span>Digital Publishing House</span>
              <span className="hidden sm:inline text-[#d4af37]/60">·</span>
              <span>Worldwide Bookstore</span>
            </div>
          </div>

          {/* Right Large Decorative Ornament (mirrored) */}
          <div className="hidden md:block shrink-0">
            <GoldCrestOrnament className="w-20 h-20 lg:w-28 lg:h-28" flipped />
          </div>
        </div>

        {/* Filigree Divider */}
        <div className="my-5">
          <FiligreeDivider className="w-64 sm:w-96 mx-auto" />
        </div>

        {/* Official Tagline */}
        <div className="max-w-3xl mx-auto mb-10 px-4">
          <p className="font-serif-display text-base sm:text-xl lg:text-2xl text-[#f3d46d] italic font-normal leading-relaxed drop-shadow">
            "Beyond the Pages, Into the Soul — Where Faith Takes Root, Healing Finds Its Way, and Purpose Comes Alive."
          </p>
        </div>

        {/* Elegant AI-powered Inspirational Quote Display */}
        <div className="mb-10">
          <QuoteSanctuary />
        </div>

        {/* Quick Entrance CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
          <button
            onClick={onExploreBooks}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3d46d] to-[#d4af37] text-[#120722] font-semibold uppercase tracking-wider shadow-lg hover:shadow-[#ffd700]/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            Explore The Bookstore
          </button>
          <button
            onClick={onExploreCollections}
            className="px-6 py-2.5 rounded-xl bg-[#230d3d] hover:bg-[#321356] text-[#fae8a4] border border-[#d4af37]/40 font-medium uppercase tracking-wider transition-all cursor-pointer"
          >
            View Eight Collections
          </button>
        </div>
      </div>
    </header>
  );
};
