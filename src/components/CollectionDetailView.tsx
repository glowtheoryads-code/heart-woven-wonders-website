import React from 'react';
import { Collection, Book } from '../types';
import {
  ArrowLeft,
  BookOpen,
  Headphones,
  FileText,
  Sparkles,
  ShoppingBag,
  Check,
  Plus,
  Shield,
  Crown,
  Heart,
  Compass,
  Users,
  Flame,
} from 'lucide-react';

interface CollectionDetailViewProps {
  collection: Collection;
  books: Book[];
  onBack: () => void;
  onSelectOtherCollection: (colId: string) => void;
  allCollections: Collection[];
  onAddToCart: (book: Book) => void;
  onOpenAdmin?: () => void;
}

const ORNAMENT_ICONS: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  Crown,
  Sparkles,
  Heart,
  Compass,
  Users,
  Shield,
  BookOpen,
  Flame,
};

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({
  collection,
  books,
  onBack,
  onSelectOtherCollection,
  allCollections,
  onAddToCart,
  onOpenAdmin,
}) => {
  const collectionBooks = books.filter(
    (b) => b.collectionId === collection.id && b.isPublished
  );

  const Icon = ORNAMENT_ICONS[collection.visualTheme.ornament] || Sparkles;

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#d4af37]/20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#ffd700] hover:text-[#fae8a4] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Collections</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-[#a89679]">
          <span>Heartwoven Wonders</span>
          <span>/</span>
          <span>Collections</span>
          <span>/</span>
          <span className="text-[#ffd700] font-medium">{collection.name}</span>
        </div>
      </div>

      {/* Collection Hero Header: Strictly Category Presentation — NO Price, NO Add to Cart */}
      <div
        className={`relative rounded-3xl overflow-hidden p-6 sm:p-10 border border-[#d4af37]/40 shadow-2xl bg-gradient-to-r ${collection.visualTheme.bgGradient}`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Collection Visual Artwork / Emblem Window */}
          <div className="w-48 h-64 sm:w-56 sm:h-72 rounded-2xl overflow-hidden bg-[#0c0416] shrink-0 border-2 border-[#d4af37]/50 shadow-2xl relative group">
            {collection.coverImage ? (
              <img
                src={collection.coverImage}
                alt={collection.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#240e3f] to-[#120722]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center border border-[#d4af37]/50 mb-3"
                  style={{ color: collection.visualTheme.accentColor }}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <span className="font-cinzel text-sm font-bold text-[#ffd700]">
                  {collection.name}
                </span>
                <span className="text-[10px] text-[#c9b78e] mt-1 uppercase tracking-widest">
                  Room 0{collection.order}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-center">
              <span className="text-[10px] font-mono tracking-widest text-[#ffd700] bg-black/60 px-2.5 py-1 rounded-full border border-white/10 uppercase">
                Room 0{collection.order} · {collection.visualTheme.frameShape}
              </span>
            </div>
          </div>

          {/* Collection Details */}
          <div className="space-y-4 flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#120722]/80 border border-[#d4af37]/40 text-xs">
              <Icon
                className="w-3.5 h-3.5"
                style={{ color: collection.visualTheme.accentColor }}
              />
              <span className="font-mono text-[#ffd700] uppercase tracking-wider text-[11px]">
                Publishing House Room 0{collection.order}
              </span>
            </div>

            <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ffd700] leading-tight">
              {collection.name}
            </h1>

            <p className="text-sm sm:text-base text-[#e5d9c2] leading-relaxed max-w-2xl">
              {collection.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-[#fae8a4]">
              <span className="bg-[#240e3f] px-3 py-1.5 rounded-xl border border-[#d4af37]/30 tabular-nums">
                {collectionBooks.length}{' '}
                {collectionBooks.length === 1 ? 'Volume Published' : 'Volumes Published'}
              </span>
              <span className="text-[#a89679]">·</span>
              <span className="text-[#c9b78e]">
                Category Sanctuary · Curated by Heartwoven Wonders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Books Assigned to this Collection */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#d4af37]/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#ffd700]" />
            <h2 className="font-cinzel text-xl font-bold text-[#f5ebd7]">
              Volumes in {collection.name}
            </h2>
          </div>
          <span className="text-xs text-[#a89679]">
            {collectionBooks.length}{' '}
            {collectionBooks.length === 1 ? 'Volume' : 'Volumes'}
          </span>
        </div>

        {collectionBooks.length === 0 ? (
          /* Regal, Appropriate Empty State */
          <div className="text-center py-20 px-6 rounded-3xl bg-gradient-to-b from-[#1b0a31] via-[#140825] to-[#0d0519] border border-dashed border-[#d4af37]/35 space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border border-[#ffd700]/40 flex items-center justify-center text-[#ffd700] mx-auto shadow-inner">
              <BookOpen className="w-8 h-8 opacity-80" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#ffd700]">
                This Sacred Collection is Currently Awaiting Literature
              </h3>
              <p className="text-xs sm:text-sm text-[#c9b78e] leading-relaxed">
                No volumes have been assigned to <span className="text-[#ffd700] font-medium">{collection.name}</span> yet.
                As new manuscripts are composed, formatted into PDF &amp; EPUB, narrated into spoken audiobooks, and approved by the publisher, they will appear here.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-[#281146] hover:bg-[#381661] text-[#ffd700] border border-[#d4af37]/40 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Browse All 8 Collections
              </button>

              {onOpenAdmin && (
                <button
                  onClick={onOpenAdmin}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider shadow hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Book to This Collection</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Book Grid when books are present in this collection */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {collectionBooks.map((book) => {
              const hasAudio = book.formats.includes('Audiobook');
              const hasEpub =
                book.formats.includes('EPUB') || book.formats.includes('PDF');

              return (
                <div
                  key={book.id}
                  className="group relative flex flex-col justify-between bg-gradient-to-b from-[#1e0d37] via-[#16092a] to-[#0f051e] rounded-2xl border border-[#d4af37]/30 hover:border-[#ffd700]/70 p-5 shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Cover */}
                    <div className="relative h-64 w-full mb-4 rounded-xl overflow-hidden bg-[#0c0416] flex items-center justify-center p-3 border border-white/5">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain rounded-md shadow-2xl transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[#c9b78e]">By {book.author}</div>
                      <h3 className="font-cinzel text-base font-bold text-[#f5ebd7] group-hover:text-[#ffd700] transition-colors">
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p className="text-xs text-[#fae8a4]/80 italic line-clamp-1">
                          {book.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-[#b8a78a] line-clamp-2 mt-2">
                        {book.description}
                      </p>
                    </div>
                  </div>

                  {/* Book Purchasing Row (Only on Book level, never on Collection level) */}
                  <div className="pt-4 mt-4 border-t border-[#d4af37]/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#a89679] uppercase">Price</div>
                      <div className="font-mono text-base font-bold text-[#ffd700]">
                        ${book.price.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => onAddToCart(book)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Other Collections Switcher */}
      <div className="pt-8 border-t border-[#d4af37]/20">
        <h3 className="font-cinzel text-base font-bold text-[#ffd700] mb-4">
          Explore Other Sacred Collections
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {allCollections
            .filter((c) => c.id !== collection.id)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectOtherCollection(c.id)}
                className="p-3 rounded-xl bg-[#17082b] hover:bg-[#2b1248] border border-[#d4af37]/25 hover:border-[#ffd700] text-left transition-colors flex flex-col justify-between cursor-pointer"
              >
                <span className="text-[10px] font-mono text-[#fae8a4]/70 uppercase">
                  Room 0{c.order}
                </span>
                <span className="font-cinzel text-xs font-semibold text-[#f5ebd7] line-clamp-2 mt-1">
                  {c.name}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
