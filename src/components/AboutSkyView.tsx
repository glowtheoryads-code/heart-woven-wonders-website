import React from 'react';
import { AuthorProfile, Book } from '../types';
import { Feather, Heart, Mail, MapPin, BookOpen, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { FiligreeDivider } from './Ornaments';

interface AboutSkyViewProps {
  author: AuthorProfile;
  books: Book[];
  onSelectBook?: (book: Book) => void;
  onOpenAdminEditor?: () => void;
}

export const AboutSkyView: React.FC<AboutSkyViewProps> = ({
  author,
  books,
  onSelectBook,
  onOpenAdminEditor,
}) => {
  const authorBooks = books.filter((b) => b.author.toLowerCase() === author.name.toLowerCase());

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Hero Banner for Sky */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#230d3e] via-[#17092c] to-[#0e051c] border border-[#d4af37]/40 p-8 sm:p-12 shadow-2xl overflow-hidden mb-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Author Portrait with Ornate Royal Gold Filigree Frame */}
          <div className="relative shrink-0">
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl p-2 bg-gradient-to-tr from-[#d4af37] via-[#8c35b8] to-[#ffd700] shadow-[0_0_35px_rgba(212,175,55,0.25)]">
              <div className="w-full h-full rounded-xl overflow-hidden bg-[#0c0416]">
                <img
                  src={author.photoUrl}
                  alt={author.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>

            {/* Floating Stamp */}
            <div className="absolute -bottom-4 -right-2 bg-[#120722] border border-[#ffd700]/60 rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-2 text-xs font-semibold text-[#ffd700]">
              <Crown className="w-4 h-4 text-[#ffd700]" />
              <span>Founder &amp; Author</span>
            </div>
          </div>

          {/* Intro Narrative */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
              <Feather className="w-4 h-4" />
              <span>The Author's Heart &amp; Calling</span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-5xl font-bold text-[#ffd700] tracking-wide">
              {author.name}
            </h1>

            <p className="font-serif-display text-base sm:text-xl text-[#fae8a4] italic font-normal leading-relaxed">
              "{author.tagline}"
            </p>

            <div className="h-[1px] w-32 bg-gradient-to-r from-[#d4af37] to-transparent my-3 mx-auto lg:mx-0" />

            <p className="text-sm sm:text-base text-[#e5d9c2] leading-relaxed">
              {author.introduction}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-5 pt-3 text-xs text-[#c9b78e]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#ffd700]" />
                <span>{author.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#ffd700]" />
                <span>{author.contactEmail}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#ffd700]" />
                <span className="tabular-nums font-semibold text-[#ffd700]">{authorBooks.length}</span>
                <span>Published Volumes</span>
              </div>
            </div>

            {onOpenAdminEditor && (
              <div className="pt-2">
                <button
                  onClick={onOpenAdminEditor}
                  className="text-xs text-[#ffd700] underline hover:text-white"
                >
                  Edit Author Profile &amp; Photo in Admin
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Core Philosophy & Purpose Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="rounded-2xl bg-[#1b0c32]/80 border border-[#d4af37]/30 p-7 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700] mb-3">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-[#f5ebd7]">
            Biography &amp; Calling
          </h3>
          <p className="text-xs sm:text-sm text-[#c9b78e] leading-relaxed">
            {author.biography}
          </p>
        </div>

        <div className="rounded-2xl bg-[#1b0c32]/80 border border-[#d4af37]/30 p-7 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700] mb-3">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-[#f5ebd7]">
            Publishing Philosophy
          </h3>
          <p className="text-xs sm:text-sm text-[#c9b78e] leading-relaxed">
            {author.philosophy}
          </p>
        </div>

        <div className="rounded-2xl bg-[#1b0c32]/80 border border-[#d4af37]/30 p-7 shadow-xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#ffd700] mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-cinzel text-lg font-bold text-[#f5ebd7]">
            Purpose &amp; Message
          </h3>
          <p className="text-xs sm:text-sm text-[#c9b78e] leading-relaxed">
            {author.purposeMessage}
          </p>
        </div>
      </div>

      {/* Published Works by Sky */}
      <div className="border-t border-[#d4af37]/20 pt-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#ffd700]">
            Published Works by {author.name}
          </h2>
          <p className="text-xs sm:text-sm text-[#c9b78e] mt-1">
            Explore the current editions crafted for inward stillness, faith, and courageous living.
          </p>
        </div>

        {authorBooks.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl bg-[#160a28]/60 border border-dashed border-[#d4af37]/25 max-w-lg mx-auto space-y-2">
            <BookOpen className="w-8 h-8 text-[#d4af37]/40 mx-auto" />
            <h4 className="font-cinzel text-base font-bold text-[#f5ebd7]">
              Forthcoming Works
            </h4>
            <p className="text-xs text-[#a89679] leading-relaxed">
              New literary works by {author.name} are currently in preparation. Once approved and published, they will appear here and in their assigned collections.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => onSelectBook && onSelectBook(book)}
                className="flex items-center gap-4 bg-[#180a2b] border border-[#d4af37]/25 rounded-2xl p-4 hover:border-[#ffd700]/60 transition-all cursor-pointer group"
              >
                <div className="w-20 h-24 rounded-lg overflow-hidden bg-[#0a0314] shrink-0 border border-white/10">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-cinzel text-sm font-bold text-[#f5ebd7] group-hover:text-[#ffd700] truncate">
                    {book.title}
                  </h4>
                  <p className="text-xs text-[#c9b78e] line-clamp-1 italic">{book.subtitle}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#ffd700]">${book.price.toFixed(2)}</span>
                    <span className="text-[11px] text-[#fae8a4] flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
