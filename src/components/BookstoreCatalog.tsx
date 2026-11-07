import React, { useState } from 'react';
import { Book, Collection } from '../types';
import {
  BookOpen,
  Headphones,
  FileText,
  Star,
  ShoppingBag,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface BookstoreCatalogProps {
  books: Book[];
  collections: Collection[];
  selectedCollectionId?: string | null;
  onSelectCollection: (id: string | null) => void;
  onAddToCart: (book: Book) => void;
  activeFilter?: 'all' | 'new-release' | 'best-seller' | 'featured';
  onFilterChange?: (filter: 'all' | 'new-release' | 'best-seller' | 'featured') => void;
}

export const BookstoreCatalog: React.FC<BookstoreCatalogProps> = ({
  books,
  collections,
  selectedCollectionId,
  onSelectCollection,
  onAddToCart,
  activeFilter = 'all',
  onFilterChange,
}) => {
  const [selectedBookForModal, setSelectedBookForModal] = useState<Book | null>(null);
  const [formatFilter, setFormatFilter] = useState<'all' | 'ebook' | 'audiobook'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedBookId, setAddedBookId] = useState<string | null>(null);

  // Audio player state inside modal
  const [playingChapterId, setPlayingChapterId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayAudio = (chapterAudioUrl: string, chapterId: string) => {
    if (playingChapterId === chapterId && isPlaying) {
      audioElement?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const newAudio = new Audio(chapterAudioUrl);
    newAudio.play();
    setAudioElement(newAudio);
    setPlayingChapterId(chapterId);
    setIsPlaying(true);

    newAudio.onended = () => {
      setIsPlaying(false);
      setPlayingChapterId(null);
    };
  };

  const filteredBooks = books.filter((b) => {
    // Only published in catalog
    if (!b.isPublished) return false;

    // Collection filter
    if (selectedCollectionId && b.collectionId !== selectedCollectionId) return false;

    // Tag filter
    if (activeFilter === 'new-release' && !b.isNewRelease) return false;
    if (activeFilter === 'best-seller' && !b.isBestSeller) return false;
    if (activeFilter === 'featured' && !b.isFeatured) return false;

    // Format filter
    if (formatFilter === 'audiobook' && !b.formats.includes('Audiobook')) return false;
    if (formatFilter === 'ebook' && !b.formats.some((f) => f === 'PDF' || f === 'EPUB')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = b.title.toLowerCase().includes(q);
      const matchSub = b.subtitle.toLowerCase().includes(q);
      const matchDesc = b.description.toLowerCase().includes(q);
      if (!matchTitle && !matchSub && !matchDesc) return false;
    }

    return true;
  });

  const handleQuickAdd = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(book);
    setAddedBookId(book.id);
    setTimeout(() => setAddedBookId(null), 1800);
  };

  const getCollectionName = (colId: string) => {
    return collections.find((c) => c.id === colId)?.name || 'Publishing Archive';
  };

  return (
    <section id="bookstore" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Bookstore Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[#d4af37]/20 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] mb-1 font-medium">
            <BookOpen className="w-4 h-4" />
            <span>Masterwork Library &amp; Releases</span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-4xl font-bold text-[#f5ebd7] tracking-wide">
            Worldwide Bookstore
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#c9b78e]">
            Delivering instant digital downloads (PDF, EPUB) and AI spoken audiobooks across the globe.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, themes, or words..."
            className="w-full bg-[#1c0c30] border border-[#d4af37]/30 rounded-xl px-4 py-2 text-xs text-[#fae8a4] placeholder-[#8e7a61] focus:outline-none focus:border-[#ffd700]"
          />
        </div>
      </div>

      {/* Filter Toolbar (Segmented Controls) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        {/* Curated Segment Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#1a0b2e] rounded-xl border border-[#d4af37]/25">
          {(
            [
              { id: 'all', label: 'All Catalog' },
              { id: 'new-release', label: 'New Releases' },
              { id: 'best-seller', label: 'Best Sellers' },
              { id: 'featured', label: 'Featured Works' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange && onFilterChange(tab.id)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#f3d46d] text-[#120722] font-semibold shadow-sm'
                  : 'text-[#d6c7a7] hover:text-[#ffd700]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Format Selectors & Collection Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#17092b] rounded-xl border border-[#d4af37]/20 text-xs">
            <button
              onClick={() => setFormatFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                formatFilter === 'all' ? 'bg-[#3d1b6b] text-[#ffd700]' : 'text-[#c9b78e]'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setFormatFilter('ebook')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                formatFilter === 'ebook' ? 'bg-[#3d1b6b] text-[#ffd700]' : 'text-[#c9b78e]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Ebooks</span>
            </button>
            <button
              onClick={() => setFormatFilter('audiobook')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                formatFilter === 'audiobook' ? 'bg-[#3d1b6b] text-[#ffd700]' : 'text-[#c9b78e]'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>Audiobooks</span>
            </button>
          </div>

          {selectedCollectionId && (
            <button
              onClick={() => onSelectCollection(null)}
              className="text-xs text-[#fae8a4] hover:text-[#ffd700] underline px-2 py-1"
            >
              Clear Room Filter
            </button>
          )}
        </div>
      </div>

      {/* Books Product Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-20 bg-[#160a28]/60 rounded-3xl border border-dashed border-[#d4af37]/30 p-8 sm:p-12 space-y-4 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border border-[#ffd700]/40 flex items-center justify-center text-[#ffd700] mx-auto shadow-inner">
            <BookOpen className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="font-cinzel text-xl sm:text-2xl font-bold text-[#ffd700]">
            {books.length === 0
              ? 'The Bookstore is Currently Awaiting Literature'
              : 'No Volumes Found in Selected Filter'}
          </h3>
          <p className="text-xs sm:text-sm text-[#c9b78e] leading-relaxed max-w-md mx-auto">
            {books.length === 0
              ? 'All sample and placeholder books have been cleared. As new literature is composed, assigned to collections, and approved by the publisher, it will appear here.'
              : 'Try clearing your search query or selecting a different room to browse other works.'}
          </p>
          {books.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSelectCollection(null);
                setFormatFilter('all');
              }}
              className="mt-2 px-5 py-2.5 bg-[#2d124f] hover:bg-[#3d186b] text-[#ffd700] text-xs font-semibold rounded-xl border border-[#d4af37]/35 uppercase tracking-wider cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBooks.map((book) => {
            const hasAudio = book.formats.includes('Audiobook');
            const hasEpub = book.formats.includes('EPUB') || book.formats.includes('PDF');

            return (
              <div
                key={book.id}
                onClick={() => setSelectedBookForModal(book)}
                className="group relative flex flex-col justify-between bg-gradient-to-b from-[#1e0d37] via-[#16092a] to-[#0f051e] rounded-2xl border border-[#d4af37]/30 hover:border-[#ffd700]/70 p-5 shadow-xl hover:shadow-[0_10px_30px_rgba(212,175,55,0.15)] transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  {/* Book 3D Cover Display Window */}
                  <div className="relative h-72 w-full mb-5 rounded-xl overflow-hidden bg-[#0c0416] flex items-center justify-center p-3 border border-white/5 group-hover:border-[#ffd700]/30 transition-colors">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain rounded-md shadow-2xl transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Quick Badge Indicators */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      {book.isNewRelease && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d4af37] text-[#120722] px-2 py-0.5 rounded shadow">
                          New Release
                        </span>
                      )}
                      {book.isBestSeller && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#3d1b6b] text-[#fae8a4] border border-[#d4af37]/40 px-2 py-0.5 rounded shadow">
                          Best Seller
                        </span>
                      )}
                    </div>

                    {/* Available format indicators */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-[#120722]/85 backdrop-blur-sm px-2 py-1 rounded-lg border border-[#d4af37]/30 text-[10px] text-[#ffd700]">
                      {hasEpub && (
                        <span title="Ebook (PDF & EPUB)">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {hasAudio && (
                        <span title="AI Spoken Audiobook Available">
                          <Headphones className="w-3.5 h-3.5 text-[#ffd700]" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] text-[#c9b78e]/80">
                      <span>{getCollectionName(book.collectionId)}</span>
                      <span>·</span>
                      <span>By {book.author}</span>
                    </div>

                    <h3 className="font-cinzel text-lg font-bold text-[#f5ebd7] group-hover:text-[#ffd700] transition-colors leading-snug">
                      {book.title}
                    </h3>

                    {book.subtitle && (
                      <p className="text-xs text-[#fae8a4]/85 italic line-clamp-1">
                        {book.subtitle}
                      </p>
                    )}

                    <p className="text-xs text-[#b8a78a] line-clamp-2 leading-relaxed pt-1">
                      {book.description}
                    </p>
                  </div>
                </div>

                {/* Card Action & Price Row */}
                <div className="mt-6 pt-4 border-t border-[#d4af37]/15 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-[#9f8f74]">Digital Edition</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-[#ffd700]">
                      ${book.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleQuickAdd(book, e)}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f3d46d] text-[#120722] text-xs font-semibold uppercase tracking-wider hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {addedBookId === book.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Detailed Inspection Modal */}
      {selectedBookForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (audioElement) audioElement.pause();
            setSelectedBookForModal(null);
          }}
        >
          <div
            className="relative bg-gradient-to-b from-[#1e0e37] via-[#16092b] to-[#0d0519] border border-[#d4af37]/50 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto text-[#f5ebd7]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                if (audioElement) audioElement.pause();
                setSelectedBookForModal(null);
              }}
              className="absolute top-5 right-5 text-[#fae8a4] hover:text-white p-2 rounded-full bg-white/5 hover:bg-white/10"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Column */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden bg-[#0a0314] p-3 border border-[#d4af37]/30 flex items-center justify-center shadow-2xl">
                  <img
                    src={selectedBookForModal.coverUrl}
                    alt={selectedBookForModal.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-md"
                  />
                </div>

                <div className="mt-4 w-full text-center">
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#ffd700]">
                    ${selectedBookForModal.price.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-[#c9b78e]">Instant Delivery &amp; Private Access</span>

                  <button
                    onClick={(e) => handleQuickAdd(selectedBookForModal, e)}
                    className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Purchase Digital Edition</span>
                  </button>
                </div>
              </div>

              {/* Details Column */}
              <div className="w-full md:w-2/3 space-y-4">
                <div>
                  <div className="text-xs text-[#fae8a4] uppercase tracking-wider font-semibold">
                    {getCollectionName(selectedBookForModal.collectionId)}
                  </div>
                  <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#ffd700] mt-1">
                    {selectedBookForModal.title}
                  </h2>
                  {selectedBookForModal.subtitle && (
                    <p className="text-sm text-[#e6d8ba] italic mt-0.5">
                      {selectedBookForModal.subtitle}
                    </p>
                  )}
                  <p className="text-xs text-[#a89679] mt-1">Written by {selectedBookForModal.author}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-[#291248] text-[#fae8a4] px-2.5 py-1 rounded-md border border-[#d4af37]/30">
                    PDF &amp; EPUB Included
                  </span>
                  {selectedBookForModal.formats.includes('Audiobook') && (
                    <span className="bg-[#3b156b] text-[#ffd700] px-2.5 py-1 rounded-md border border-[#ffd700]/40 flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Full Audiobook Edition</span>
                    </span>
                  )}
                  <span className="text-[#a89679] px-2 py-1">
                    {selectedBookForModal.pageCount} Pages
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-[#d6c7a7] leading-relaxed">
                  {selectedBookForModal.description}
                </div>

                {/* Chapter List & Audio Preview */}
                <div className="pt-4 border-t border-[#d4af37]/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffd700] mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Table of Chapters &amp; Narration</span>
                  </h4>

                  {selectedBookForModal.chapters && selectedBookForModal.chapters.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedBookForModal.chapters.map((chap) => {
                        const hasAudio = Boolean(chap.audioUrl);
                        const isThisPlaying = playingChapterId === chap.id && isPlaying;

                        return (
                          <div
                            key={chap.id}
                            className="p-2.5 rounded-lg bg-[#220d3d]/60 border border-white/5 flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#f5ebd7]">
                                Chapter {chap.chapterNumber}: {chap.title}
                              </span>
                              <span className="text-[11px] text-[#9f8f74] line-clamp-1">
                                {chap.content.slice(0, 90)}...
                              </span>
                            </div>

                            {hasAudio ? (
                              <button
                                onClick={() => handlePlayAudio(chap.audioUrl!, chap.id)}
                                className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 text-[11px] transition-colors ${
                                  isThisPlaying
                                    ? 'bg-[#ffd700] text-[#120722] border-[#ffd700] font-bold'
                                    : 'bg-[#311554] text-[#ffd700] border-[#d4af37]/40 hover:bg-[#431c73]'
                                }`}
                              >
                                {isThisPlaying ? (
                                  <>
                                    <Pause className="w-3 h-3" />
                                    <span>Playing</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    <span>Listen</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-[10px] text-[#7d6f58]">Text Only</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8e7e66] italic">Complete manuscript formatted for download.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
