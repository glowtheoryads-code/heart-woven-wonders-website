import React, { useState, useEffect } from 'react';
import {
  Book,
  Collection,
  AuthorProfile,
  StoreSettings,
  Customer,
  Purchase,
} from './types';
import { AnnouncementStrip } from './components/AnnouncementStrip';
import { Navbar, NavTab } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { CollectionsView } from './components/CollectionsView';
import { CollectionDetailView } from './components/CollectionDetailView';
import { BookstoreCatalog } from './components/BookstoreCatalog';
import { AboutSkyView } from './components/AboutSkyView';
import { MyLibraryView } from './components/MyLibraryView';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { PoliciesModal } from './components/PoliciesModal';
import {
  BookOpen,
  Headphones,
  ShieldCheck,
  Globe,
  Sparkles,
  ArrowRight,
  Heart,
  Download,
  Lock,
  User,
  FileText,
} from 'lucide-react';
import { FiligreeDivider, GoldCrestOrnament } from './components/Ornaments';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  // Customer & Purchases State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [activePolicyId, setActivePolicyId] = useState<string | undefined>(undefined);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hw_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'new-release' | 'best-seller' | 'featured'>('all');

  // Load initial data
  const fetchData = async () => {
    try {
      const [booksRes, colRes, authRes, setRes] = await Promise.all([
        fetch('/api/books').then((r) => r.json()),
        fetch('/api/collections').then((r) => r.json()),
        fetch('/api/author').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json()),
      ]);

      if (booksRes.books) setBooks(booksRes.books);
      if (colRes.collections) setCollections(colRes.collections);
      if (authRes.author) setAuthor(authRes.author);
      if (setRes.settings) setSettings(setRes.settings);
    } catch (e) {
      console.error('Failed to load Heartwoven Wonders data:', e);
    }
  };

  const fetchCustomer = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
      } else {
        setCustomer(null);
      }
    } catch (e) {
      console.error('Failed to check current session:', e);
    }
  };

  const fetchPurchases = async () => {
    try {
      const res = await fetch('/api/customer/purchases');
      const data = await res.json();
      if (data.purchases) {
        setPurchases(data.purchases);
      }
    } catch (e) {
      console.error('Failed to fetch purchases:', e);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCustomer();
    fetchPurchases();
  }, []);

  // Whenever customer changes, reload purchases
  useEffect(() => {
    fetchPurchases();
  }, [customer]);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('hw_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, [cartItems]);

  const handleAddToCart = (book: Book) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.book.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.book.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { book, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (bookId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.book.id === bookId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCartItems((prev) => prev.filter((item) => item.book.id !== bookId));
  };

  const handleSelectNavTab = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab === 'shop' || tab === 'all-books') {
      setSelectedCollectionId(null);
      setCatalogFilter('all');
    } else if (tab === 'collections') {
      setSelectedCollectionId(null);
    } else if (tab === 'new-release') {
      setSelectedCollectionId(null);
      setCatalogFilter('new-release');
    } else if (tab === 'best-seller') {
      setSelectedCollectionId(null);
      setCatalogFilter('best-seller');
    } else if (tab === 'featured') {
      setSelectedCollectionId(null);
      setCatalogFilter('featured');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCollection = (colId: string | null) => {
    setSelectedCollectionId(colId);
    if (colId) {
      setCurrentTab('collections');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenSpecificPolicy = (policySlugOrId: string) => {
    const pol = settings?.policies.find(
      (p) => p.id === policySlugOrId || p.slug === policySlugOrId
    );
    if (pol) {
      setActivePolicyId(pol.id);
    }
    setIsPoliciesOpen(true);
  };

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId) || null;

  return (
    <div className="min-h-screen bg-[#0d0617] text-[#f5f0e8] flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-[#ffd700]">
      {/* 1. Top Announcement Strip */}
      <AnnouncementStrip text={settings?.announcementText} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectNavTab}
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        customer={customer}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPolicies={() => {
          setActivePolicyId(undefined);
          setIsPoliciesOpen(true);
        }}
        libraryCount={purchases.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW: HOME */}
        {currentTab === 'home' && (
          <div>
            {/* Section: Top Hero Brand Lockup & Quote Sanctuary */}
            <HeroHeader
              onExploreBooks={() => handleSelectNavTab('shop')}
              onExploreCollections={() => {
                const el = document.getElementById('collections');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Render Homepage Sections Ordered According to Store Settings */}
            {(settings?.homepageSections || [
              { id: 'sec-collections', name: 'Collections', visible: true, order: 1 },
              { id: 'sec-featured', name: 'Featured', visible: true, order: 2 },
              { id: 'sec-about', name: 'About', visible: true, order: 3 },
              { id: 'sec-audiobook-spotlight', name: 'Audiobook', visible: true, order: 4 },
            ])
              .filter((s) => s.visible && s.id !== 'sec-quote')
              .sort((a, b) => a.order - b.order)
              .map((section) => {
                if (section.id === 'sec-collections') {
                  return (
                    <CollectionsView
                      key={section.id}
                      collections={collections}
                      books={books}
                      selectedCollectionId={selectedCollectionId}
                      onSelectCollection={handleSelectCollection}
                      onClearFilter={() => setSelectedCollectionId(null)}
                    />
                  );
                }

                if (section.id === 'sec-featured') {
                  return (
                    <BookstoreCatalog
                      key={section.id}
                      books={books}
                      collections={collections}
                      selectedCollectionId={selectedCollectionId}
                      onSelectCollection={setSelectedCollectionId}
                      onAddToCart={handleAddToCart}
                      activeFilter={catalogFilter}
                      onFilterChange={setCatalogFilter}
                    />
                  );
                }

                if (section.id === 'sec-about' && author) {
                  return (
                    <section key={section.id} className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                      <div className="rounded-3xl bg-gradient-to-r from-[#210c3b] via-[#18092d] to-[#120722] border border-[#d4af37]/35 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 border-2 border-[#d4af37]/50 shadow-lg bg-[#0a0314]">
                          <img
                            src={author.photoUrl}
                            alt={author.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-3 flex-1 text-center md:text-left">
                          <span className="text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                            Meet The Author &amp; Founder
                          </span>
                          <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#ffd700]">
                            About {author.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-[#e5d9c2] leading-relaxed">
                            {author.introduction}
                          </p>
                          <div className="pt-2">
                            <button
                              onClick={() => handleSelectNavTab('about-sky')}
                              className="px-5 py-2 rounded-xl bg-[#371661] hover:bg-[#4b1d84] text-[#ffd700] border border-[#d4af37]/40 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
                            >
                              <span>Read Complete Biography &amp; Philosophy</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>
                  );
                }

                if (section.id === 'sec-audiobook-spotlight') {
                  return (
                    <section key={section.id} className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                      <div className="rounded-3xl bg-gradient-to-b from-[#1b0a31] via-[#240e42] to-[#140825] border border-[#ffd700]/30 p-8 sm:p-10 shadow-2xl text-center max-w-4xl mx-auto space-y-4">
                        <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 border border-[#ffd700]/50 flex items-center justify-center text-[#ffd700] mx-auto">
                          <Headphones className="w-6 h-6" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-[#ffd700] font-semibold">
                          Proprietary Publishing Audio Technology
                        </span>
                        <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-[#f5ebd7]">
                          AI Spoken Narration Studio
                        </h3>
                        <p className="text-xs sm:text-sm text-[#c9b78e] max-w-2xl mx-auto leading-relaxed">
                          We do not display empty audio badges. Heartwoven Wonders produces genuine chapter-by-chapter spoken narration using Gemini 3.8 Flash-Lite TTS with five authentic contemplative narrators.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                          <button
                            onClick={() => handleSelectNavTab('shop')}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#ffd700] text-[#120722] font-bold text-xs uppercase tracking-wider shadow cursor-pointer"
                          >
                            Listen in Bookstore
                          </button>
                          <button
                            onClick={() => setIsAdminOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-[#2b124a] text-[#ffd700] border border-[#d4af37]/40 text-xs font-semibold uppercase tracking-wider hover:bg-[#3c1866] cursor-pointer"
                          >
                            Open Audiobook Production Studio
                          </button>
                        </div>
                      </div>
                    </section>
                  );
                }

                return null;
              })}
          </div>
        )}

        {/* VIEW: SHOP / ALL BOOKS / FILTERED */}
        {(currentTab === 'shop' ||
          currentTab === 'all-books' ||
          currentTab === 'new-release' ||
          currentTab === 'best-seller' ||
          currentTab === 'featured') && (
          <div className="pt-6">
            <BookstoreCatalog
              books={books}
              collections={collections}
              selectedCollectionId={selectedCollectionId}
              onSelectCollection={setSelectedCollectionId}
              onAddToCart={handleAddToCart}
              activeFilter={catalogFilter}
              onFilterChange={setCatalogFilter}
            />
          </div>
        )}

        {/* VIEW: COLLECTIONS (Requirement 3: Dedicated Collection Page) */}
        {currentTab === 'collections' && (
          <div className="pt-6">
            {selectedCollection ? (
              <CollectionDetailView
                collection={selectedCollection}
                books={books}
                onBack={() => setSelectedCollectionId(null)}
                onSelectOtherCollection={(id) => setSelectedCollectionId(id)}
                allCollections={collections}
                onAddToCart={handleAddToCart}
                onOpenAdmin={() => setIsAdminOpen(true)}
              />
            ) : (
              <CollectionsView
                collections={collections}
                books={books}
                selectedCollectionId={null}
                onSelectCollection={handleSelectCollection}
                onClearFilter={() => setSelectedCollectionId(null)}
              />
            )}
          </div>
        )}

        {/* VIEW: ABOUT SKY */}
        {currentTab === 'about-sky' && author && (
          <AboutSkyView
            author={author}
            books={books}
            onSelectBook={(book) => {
              setSelectedCollectionId(book.collectionId);
              setCurrentTab('shop');
            }}
            onOpenAdminEditor={() => setIsAdminOpen(true)}
          />
        )}

        {/* VIEW: MY LIBRARY */}
        {currentTab === 'my-library' && (
          <MyLibraryView
            purchases={purchases}
            customer={customer}
            onOpenAuth={() => setIsAuthOpen(true)}
            onExploreStore={() => handleSelectNavTab('shop')}
          />
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCartItems([])}
        currentCustomer={customer}
        onCheckoutSuccess={() => {
          fetchPurchases();
          handleSelectNavTab('my-library');
        }}
      />

      {/* Admin Dashboard */}
      {author && settings && (
        <AdminDashboard
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          books={books}
          collections={collections}
          author={author}
          settings={settings}
          onRefreshData={fetchData}
        />
      )}

      {/* Customer Authentication Modal */}
      <CustomerAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentCustomer={customer}
        onCustomerChange={(c) => {
          setCustomer(c);
          fetchPurchases();
        }}
      />

      {/* Store Policies & Information Modal */}
      {settings?.policies && (
        <PoliciesModal
          isOpen={isPoliciesOpen}
          onClose={() => setIsPoliciesOpen(false)}
          policies={settings.policies}
          initialPolicyId={activePolicyId}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-[#d4af37]/25 bg-[#0b0414] py-14 px-4 sm:px-6 lg:px-8 text-xs text-[#b8a78a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <span className="font-cinzel text-base font-bold text-[#ffd700] tracking-wider">
              HEARTWOVEN WONDERS
            </span>
            <span className="text-[11px] text-[#e5d9c2] tracking-widest uppercase">
              Digital Publishing House · Worldwide Bookstore
            </span>
            <p className="text-[11px] text-[#8e7e64] max-w-md italic pt-1">
              "Beyond the Pages, Into the Soul — Where Faith Takes Root, Healing Finds Its Way, and Purpose Comes Alive."
            </p>
            <div className="text-[10px] text-[#d4af37]/80 pt-2 flex flex-wrap gap-x-4 gap-y-1">
              <span>Instant PDF &amp; EPUB</span>
              <span>·</span>
              <span>Spoken Audiobooks</span>
              <span>·</span>
              <span>Global PayPal Settlement (T&amp;T USD Supported)</span>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-2">
            {/* Quick Navigation Links */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 text-xs text-[#fae8a4]">
              <button onClick={() => handleSelectNavTab('home')} className="hover:text-white cursor-pointer">
                Home
              </button>
              <button onClick={() => handleSelectNavTab('shop')} className="hover:text-white cursor-pointer">
                Bookstore
              </button>
              <button onClick={() => handleSelectNavTab('collections')} className="hover:text-white cursor-pointer">
                Collections
              </button>
              <button onClick={() => handleSelectNavTab('about-sky')} className="hover:text-white cursor-pointer">
                About Sky
              </button>
              <button onClick={() => handleSelectNavTab('my-library')} className="hover:text-white cursor-pointer">
                My Library {purchases.length > 0 && `(${purchases.length})`}
              </button>
              <button onClick={() => setIsAdminOpen(true)} className="text-[#ffd700] font-semibold hover:underline cursor-pointer">
                Admin Console
              </button>
            </div>

            {/* Policy & Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 text-[11px] text-[#a89679]">
              <button
                onClick={() => handleOpenSpecificPolicy('pol-terms')}
                className="hover:text-[#ffd700] underline cursor-pointer"
              >
                Terms of Service
              </button>
              <span>·</span>
              <button
                onClick={() => handleOpenSpecificPolicy('pol-privacy')}
                className="hover:text-[#ffd700] underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                onClick={() => handleOpenSpecificPolicy('pol-delivery')}
                className="hover:text-[#ffd700] underline cursor-pointer"
              >
                Digital Delivery Policy
              </button>
              <span>·</span>
              <button
                onClick={() => handleOpenSpecificPolicy('pol-refunds')}
                className="hover:text-[#ffd700] underline cursor-pointer"
              >
                Refund Policy
              </button>
              <span>·</span>
              <button
                onClick={() => handleOpenSpecificPolicy('pol-faq')}
                className="hover:text-[#ffd700] underline cursor-pointer"
              >
                FAQ &amp; Contact
              </button>
            </div>

            <p className="text-[10px] text-[#786b55] pt-1">
              &copy; {new Date().getFullYear()} Heartwoven Wonders Publishing House. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
