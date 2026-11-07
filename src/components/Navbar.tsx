import React, { useState } from 'react';
import { ShoppingBag, BookOpen, User, Shield, Menu, X, Sparkles, FileText } from 'lucide-react';
import { Customer } from '../types';

export type NavTab =
  | 'home'
  | 'shop'
  | 'all-books'
  | 'collections'
  | 'new-release'
  | 'best-seller'
  | 'featured'
  | 'about-sky'
  | 'my-library'
  | 'admin';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  customer?: Customer | null;
  onOpenAuth?: () => void;
  onOpenPolicies?: () => void;
  libraryCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  customer,
  onOpenAuth,
  onOpenPolicies,
  libraryCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavTab; label: string; badge?: number }[] = [
    { id: 'home', label: 'Home' },
    { id: 'shop', label: 'Shop' },
    { id: 'all-books', label: 'All Books' },
    { id: 'collections', label: 'Collections' },
    { id: 'new-release', label: 'New Release' },
    { id: 'best-seller', label: 'Best Seller' },
    { id: 'featured', label: 'Featured' },
    { id: 'about-sky', label: 'About Sky' },
    { id: 'my-library', label: 'My Library', badge: libraryCount },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#120722]/95 backdrop-blur-md border-b border-[#d4af37]/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Mark (Desktop & Mobile) */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3a1563] to-[#d4af37]/40 border border-[#d4af37]/60 flex items-center justify-center shadow-md">
              <span className="text-[#ffd700] font-cinzel text-base font-bold">H</span>
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-sm sm:text-base font-semibold tracking-wider text-[#ffd700] group-hover:text-[#fae8a4] transition-colors">
                HEARTWOVEN WONDERS
              </span>
              <span className="text-[10px] text-[#c9b78e] tracking-widest uppercase font-light">
                Digital Publishing House
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-5">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative text-xs uppercase tracking-wider font-medium transition-all duration-200 py-1.5 focus:outline-none whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#ffd700] font-semibold'
                      : 'text-[#e6d8ba] hover:text-[#ffd700]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="bg-[#ffd700] text-[#120722] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full tabular-nums">
                      {link.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffd700] to-transparent" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions (Customer Account, Cart, Admin) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Account Button */}
            <button
              onClick={onOpenAuth}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs text-[#fae8a4] hover:text-[#ffd700] transition-colors rounded-lg border border-[#d4af37]/25 hover:border-[#ffd700]/60 bg-[#230d3d]/50 focus:outline-none flex items-center gap-1.5 cursor-pointer"
              title={customer ? `Signed in as ${customer.name}` : 'Sign In / Register'}
            >
              <User className="w-4 h-4 text-[#ffd700]" />
              <span className="hidden lg:inline text-xs font-medium tracking-wider">
                {customer ? customer.name.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-[#ffd700] hover:text-white transition-colors rounded-lg border border-[#d4af37]/25 hover:border-[#ffd700]/60 bg-[#230d3d]/50 focus:outline-none flex items-center gap-1.5 cursor-pointer"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider text-[#f4efe6]">
                Cart
              </span>
              {cartCount > 0 && (
                <span className="bg-[#ffd700] text-[#120722] text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin Sanctuary */}
            <button
              onClick={onOpenAdmin}
              className="p-2 text-[#f3d46d] hover:text-[#ffd700] transition-colors rounded-lg border border-[#d4af37]/35 hover:border-[#ffd700] bg-gradient-to-r from-[#291248] to-[#3a1563] text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Admin Sanctuary & Settings"
            >
              <Shield className="w-3.5 h-3.5 text-[#ffd700]" />
              <span className="hidden md:inline">Admin</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[#ffd700] hover:text-white focus:outline-none rounded-lg border border-[#d4af37]/25 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#180a2d] border-b border-[#d4af37]/30 px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#d4af37]/15">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`text-left text-xs uppercase tracking-wider px-3 py-2 rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#3d1b6b] text-[#ffd700] font-semibold border border-[#d4af37]/40'
                      : 'text-[#e5d9c2] hover:bg-[#25103f] hover:text-[#ffd700]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="bg-[#ffd700] text-[#120722] text-[9px] font-bold px-1.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenAuth?.();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 rounded-lg border border-[#d4af37]/30 bg-[#25103f] text-[#ffd700] text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>{customer ? `Signed in as ${customer.name}` : 'Customer Sign In / Register'}</span>
            </button>

            {onOpenPolicies && (
              <button
                onClick={() => {
                  onOpenPolicies();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2 rounded-lg border border-[#d4af37]/20 bg-[#1d0d34] text-[#fae8a4] text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Store Policies &amp; Information</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full text-center py-2.5 rounded-lg border border-[#ffd700]/50 bg-gradient-to-r from-[#321356] to-[#461979] text-[#ffd700] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Publisher Admin Sanctuary
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
