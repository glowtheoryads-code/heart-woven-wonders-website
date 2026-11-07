import React, { useState } from 'react';
import { Purchase, Customer } from '../types';
import {
  BookOpen,
  Headphones,
  Download,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Calendar,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface MyLibraryViewProps {
  purchases: Purchase[];
  customer: Customer | null;
  onOpenAuth: () => void;
  onExploreStore: () => void;
}

export const MyLibraryView: React.FC<MyLibraryViewProps> = ({
  purchases,
  customer,
  onOpenAuth,
  onExploreStore,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ebooks' | 'audiobooks'>('all');
  const [playingAudiobookId, setPlayingAudiobookId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const filteredPurchases = purchases.filter((p) => {
    if (activeTab === 'audiobooks') {
      return p.formats.includes('Audiobook');
    }
    if (activeTab === 'ebooks') {
      return p.formats.includes('PDF') || p.formats.includes('EPUB');
    }
    return true;
  });

  const handlePlayAudio = (bookId: string) => {
    if (playingAudiobookId === bookId && isPlaying) {
      currentAudio?.pause();
      setIsPlaying(false);
      return;
    }

    if (currentAudio) {
      currentAudio.pause();
    }

    const audioUrl = `/api/download/audio/${bookId}`;
    const newAudio = new Audio(audioUrl);
    newAudio.play().catch((err) => {
      console.error('Audio playback error:', err);
      alert('Chapter audio is preparing or currently being synthesized by the publisher.');
    });

    setCurrentAudio(newAudio);
    setPlayingAudiobookId(bookId);
    setIsPlaying(true);

    newAudio.onended = () => {
      setIsPlaying(false);
      setPlayingAudiobookId(null);
    };
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Library Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 border-b border-[#d4af37]/25 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ffd700] mb-1 font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Private Customer Shelf</span>
          </div>
          <h1 className="font-cinzel text-3xl sm:text-4xl font-bold text-[#ffd700]">
            My Digital Library
          </h1>
          <p className="text-xs sm:text-sm text-[#c9b78e] mt-1">
            Access, read, and listen to your permanent collection of Heartwoven Wonders masterworks.
          </p>
        </div>

        {/* Customer Status Lockup */}
        <div className="flex items-center gap-3">
          {customer ? (
            <div className="p-3 rounded-2xl bg-[#1b0a31] border border-[#d4af37]/30 flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#ffd700] text-[#120722] font-bold flex items-center justify-center">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-[#f5ebd7]">{customer.name}</div>
                <div className="text-[11px] text-[#c9b78e]">{customer.email}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-[#281146] text-[#ffd700] border border-[#d4af37]/40 hover:bg-[#3d186b] text-xs font-semibold cursor-pointer"
            >
              Sign In to Sync Purchases
            </button>
          )}
        </div>
      </div>

      {/* Library Shelf Navigation Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#17082b] rounded-xl border border-[#d4af37]/20 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'all' ? 'bg-[#3d186b] text-[#ffd700] font-semibold' : 'text-[#c9b78e]'
            }`}
          >
            All Works ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab('ebooks')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ebooks' ? 'bg-[#3d186b] text-[#ffd700] font-semibold' : 'text-[#c9b78e]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ebooks (PDF &amp; EPUB)</span>
          </button>
          <button
            onClick={() => setActiveTab('audiobooks')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audiobooks' ? 'bg-[#3d186b] text-[#ffd700] font-semibold' : 'text-[#c9b78e]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Spoken Audiobooks</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#e5c158]">
          <ShieldCheck className="w-4 h-4 text-[#ffd700]" />
          <span>Verified Digital Deliverables</span>
        </div>
      </div>

      {/* Library Items Grid */}
      {filteredPurchases.length === 0 ? (
        <div className="text-center py-20 bg-[#160a28]/60 rounded-3xl border border-dashed border-[#d4af37]/25 p-8 space-y-4">
          <BookOpen className="w-12 h-12 text-[#d4af37]/35 mx-auto" />
          <h3 className="font-cinzel text-xl font-bold text-[#f5ebd7]">
            {activeTab === 'all'
              ? 'Your Library Shelf is Empty'
              : `No ${activeTab === 'audiobooks' ? 'Audiobooks' : 'Ebooks'} Found in Your Shelf`}
          </h3>
          <p className="text-xs text-[#a89679] max-w-md mx-auto leading-relaxed">
            Every digital book and spoken narration purchased via PayPal is instantly catalogued in your personal library for lifetime reading and streaming.
          </p>
          <div className="pt-2">
            <button
              onClick={onExploreStore}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold text-xs uppercase tracking-wider shadow"
            >
              Explore Bookstore Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPurchases.map((pur) => {
            const hasPdf = pur.formats.includes('PDF');
            const hasEpub = pur.formats.includes('EPUB');
            const hasAudio = pur.formats.includes('Audiobook');
            const isPlayingThisAudio = playingAudiobookId === pur.bookId && isPlaying;

            return (
              <div
                key={pur.id}
                className="bg-gradient-to-b from-[#1c0c32] via-[#140825] to-[#0e051c] rounded-2xl border border-[#d4af37]/35 p-5 shadow-xl flex flex-col justify-between space-y-4 transition-all hover:border-[#ffd700]/60"
              >
                <div>
                  {/* Top Cover & Title Row */}
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-28 rounded-lg overflow-hidden bg-[#0c0416] shrink-0 border border-white/10 shadow-md">
                      <img
                        src={pur.bookCoverUrl}
                        alt={pur.bookTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#c9b78e]">
                        <Calendar className="w-3 h-3 text-[#ffd700]" />
                        <span>Acquired {new Date(pur.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-cinzel text-base font-bold text-[#f5ebd7] mt-1 leading-snug line-clamp-2">
                        {pur.bookTitle}
                      </h3>
                      <p className="text-xs text-[#fae8a4] italic mt-0.5">By {pur.bookAuthor}</p>

                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Order #{pur.paypalOrderId.slice(-8)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual, Unambiguous Format Controls (Section 7) */}
                <div className="pt-3 border-t border-[#d4af37]/20 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#fae8a4]">
                    Available Formats &amp; Deliverables
                  </span>

                  <div className="grid grid-cols-1 gap-2">
                    {/* PDF Format Control (Only if available!) */}
                    {hasPdf && (
                      <a
                        href={`/api/download/pdf/${pur.bookId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#261042] hover:bg-[#371661] border border-[#d4af37]/30 text-xs text-[#f5ebd7] flex items-center justify-between transition-colors"
                        title="Download or Read Formatted PDF Edition"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#ffd700]" />
                          <span className="font-semibold">Download PDF Edition</span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-[#ffd700]" />
                      </a>
                    )}

                    {/* EPUB Format Control (Only if available!) */}
                    {hasEpub && (
                      <a
                        href={`/api/download/epub/${pur.bookId}`}
                        className="p-2 rounded-xl bg-[#261042] hover:bg-[#371661] border border-[#d4af37]/30 text-xs text-[#f5ebd7] flex items-center justify-between transition-colors"
                        title="Download Standard EPUB for Apple Books, Kindle, Kobo"
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#ffd700]" />
                          <span className="font-semibold">Download EPUB Edition</span>
                        </div>
                        <Download className="w-3.5 h-3.5 text-[#ffd700]" />
                      </a>
                    )}

                    {/* Audiobook Stream & Download Controls (Only if available!) */}
                    {hasAudio && (
                      <div className="p-2.5 rounded-xl bg-[#2f1352] border border-[#ffd700]/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-[#ffd700]">
                            <Headphones className="w-4 h-4" />
                            <span>Spoken Audiobook Edition</span>
                          </div>
                          <a
                            href={`/api/download/audio/${pur.bookId}`}
                            className="text-[10px] text-[#fae8a4] hover:text-white underline flex items-center gap-1"
                            title="Download Audio File (.wav / .mp3)"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download MP3</span>
                          </a>
                        </div>

                        {/* In-shelf Player Button */}
                        <button
                          onClick={() => handlePlayAudio(pur.bookId)}
                          className={`w-full py-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                            isPlayingThisAudio
                              ? 'bg-[#ffd700] text-[#120722] border-[#ffd700]'
                              : 'bg-[#1a0a2f] text-[#ffd700] border-[#d4af37]/40 hover:bg-[#3d186b]'
                          }`}
                        >
                          {isPlayingThisAudio ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Pause Narration</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Listen in Library</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
