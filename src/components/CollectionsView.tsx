import React from 'react';
import { Collection, Book } from '../types';
import {
  Sparkles,
  Heart,
  Compass,
  Users,
  Shield,
  BookOpen,
  Flame,
  ArrowRight,
  Bookmark,
  Crown,
} from 'lucide-react';

interface CollectionsViewProps {
  collections: Collection[];
  books: Book[];
  onSelectCollection: (collectionId: string) => void;
  selectedCollectionId?: string | null;
  onClearFilter?: () => void;
  isAdmin?: boolean;
  onEditCollection?: (collection: Collection) => void;
}

const ORNAMENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Crown,
  Sparkles,
  Heart,
  Compass,
  Users,
  Shield,
  BookOpen,
  Flame,
};

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  books,
  onSelectCollection,
  selectedCollectionId,
  onClearFilter,
  isAdmin = false,
  onEditCollection,
}) => {
  const visibleCollections = [...collections]
    .filter((c) => c.showOnHomepage || selectedCollectionId === c.id)
    .sort((a, b) => a.order - b.order);

  // Return custom frame styling based on the collection's frameShape
  const getFrameClasses = (shape: string) => {
    switch (shape) {
      case 'arch':
        return 'rounded-t-[40px] rounded-b-2xl border-2 border-[#d4af37]/60 shadow-[0_0_20px_rgba(212,175,55,0.15)]';
      case 'faceted':
        return 'rounded-2xl border-2 border-purple-400/50 shadow-[0_0_20px_rgba(192,132,252,0.15)] [clip-path:polygon(0%_12px,12px_0%,calc(100%-12px)_0%,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0%_calc(100%-12px))]';
      case 'halo':
        return 'rounded-[32px] border-2 border-pink-400/50 shadow-[0_0_20px_rgba(244,114,182,0.15)]';
      case 'filigree':
        return 'rounded-xl border-2 border-amber-400/60 shadow-[0_0_25px_rgba(251,191,36,0.15)]';
      case 'seal':
        return 'rounded-2xl border-2 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.15)]';
      case 'crest':
        return 'rounded-t-xl rounded-b-[36px] border-2 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)]';
      case 'quill':
        return 'rounded-r-2xl rounded-l-md border-2 border-violet-400/50 shadow-[0_0_20px_rgba(167,139,250,0.15)]';
      case 'embossed':
      default:
        return 'rounded-3xl border-2 border-fuchsia-400/50 shadow-[0_0_20px_rgba(232,121,249,0.15)]';
    }
  };

  return (
    <section id="collections" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] mb-2 font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Curated Digital Sanctuaries</span>
        </div>
        <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-[#f5ebd7] tracking-wide">
          Eight Distinctive Book Collections
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#c9b78e] leading-relaxed">
          Step into eight distinct rooms within our publishing house. Each collection possesses its own visual soul, contemplative themes, and handcrafted literature.
        </p>

        {selectedCollectionId && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-xs text-[#fae8a4]">
              Filtering by active collection
            </span>
            <button
              onClick={onClearFilter}
              className="text-xs text-[#ffd700] underline hover:text-white"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* Collection Cards Grid: Each card has its OWN distinctive shape & aesthetic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {visibleCollections.map((col) => {
          const Icon = ORNAMENT_ICONS[col.visualTheme.ornament] || Sparkles;
          const bookCount = books.filter((b) => b.collectionId === col.id).length;
          const isSelected = selectedCollectionId === col.id;
          const frameClass = getFrameClasses(col.visualTheme.frameShape);

          return (
            <div
              key={col.id}
              className={`group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer bg-gradient-to-b ${col.visualTheme.bgGradient} ${frameClass} ${
                isSelected ? 'ring-2 ring-[#ffd700] shadow-[0_0_30px_rgba(255,215,0,0.35)]' : ''
              }`}
              onClick={() => onSelectCollection(col.id)}
            >
              {/* Top Room Banner / Header with Theme Icon */}
              <div className="relative p-5 pb-3 z-10 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[#120722]/80 border border-[#d4af37]/40 shadow-inner"
                    style={{ color: col.visualTheme.accentColor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono tracking-widest text-[#fae8a4]/75 uppercase">
                    Room 0{col.order}
                  </span>
                </div>

                <span className="text-[11px] font-medium tracking-wide text-[#e5c158] tabular-nums">
                  {bookCount} {bookCount === 1 ? 'Volume' : 'Volumes'}
                </span>
              </div>

              {/* Unique Visual Motif / Artwork Window */}
              <div className="relative px-5 py-2 z-10">
                <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 group-hover:border-[#ffd700]/50 transition-colors bg-[#0a0314] flex items-center justify-center">
                  {col.coverImage ? (
                    <img
                      src={col.coverImage}
                      alt={col.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-85 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-[#240e3f] to-[#120722]">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center border border-[#d4af37]/40 mb-2 shadow-inner"
                        style={{ color: col.visualTheme.accentColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] text-[#fae8a4] font-cinzel font-semibold tracking-wider">
                        Sacred Room Emblem
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e051c] via-[#0e051c]/30 to-transparent pointer-events-none" />

                  {/* Visual Accent Badge */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-[#fae8a4]">
                    <span className="font-cinzel text-xs font-semibold tracking-wider text-[#ffd700] truncate">
                      {col.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Interactive Footer */}
              <div className="p-5 pt-3 z-10 flex flex-col flex-grow justify-between">
                <div>
                  <h3 className="font-cinzel text-base font-bold text-[#f5ebd7] group-hover:text-[#ffd700] transition-colors leading-snug">
                    {col.name}
                  </h3>
                  <p className="mt-2 text-xs text-[#c9b78e]/90 line-clamp-3 leading-relaxed">
                    {col.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#ffd700] font-medium flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Enter Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>

                  {isAdmin && onEditCollection && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCollection(col);
                      }}
                      className="text-[11px] text-[#fae8a4] hover:text-white underline cursor-pointer"
                    >
                      Edit Room
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
