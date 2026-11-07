import React, { useState } from 'react';
import { Book, Customer } from '../types';
import {
  ShoppingBag,
  X,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Headphones,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface CartItem {
  book: Book;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (bookId: string, delta: number) => void;
  onRemoveItem: (bookId: string) => void;
  onClearCart: () => void;
  currentCustomer: Customer | null;
  onCheckoutSuccess: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentCustomer,
  onCheckoutSuccess,
}) => {
  const [customerEmail, setCustomerEmail] = useState(currentCustomer?.email || '');
  const [customerName, setCustomerName] = useState(currentCustomer?.name || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.book.price * item.quantity, 0);

  const handlePayPalCheckout = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address to receive your digital download keys.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create order on secure backend
      const createRes = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerEmail,
          customerName: customerName || 'Valued Reader',
        }),
      });

      const createData = await createRes.json();
      if (!createData.orderId) {
        throw new Error(createData.error || 'Failed to initialize PayPal order.');
      }

      // 2. Capture and verify payment on backend
      const captureRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createData.orderId,
          items,
          customerEmail,
          customerName: customerName || 'Valued Reader',
        }),
      });

      const captureData = await captureRes.json();
      if (!captureData.success) {
        throw new Error(captureData.error || 'Backend failed to capture verified payment.');
      }

      setOrderSummary(captureData);
      setCheckoutCompleted(true);
      onClearCart();
      onCheckoutSuccess();
    } catch (err: any) {
      console.error('PayPal checkout error:', err);
      setErrorMessage(err.message || 'Payment processing error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-gradient-to-b from-[#1c0c32] via-[#140825] to-[#0e051c] border-l border-[#d4af37]/40 h-full flex flex-col justify-between p-6 shadow-2xl text-[#f5ebd7] animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cart Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#d4af37]/20">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#ffd700]" />
              <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
                Your Sacred Cart
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#fae8a4] hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-[#281146]/60 border border-[#d4af37]/20 text-[11px] text-[#e6d8ba] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ffd700] shrink-0" />
            <span>Instant delivery to My Library upon verified PayPal checkout</span>
          </div>
        </div>

        {/* Checkout Completed Confirmation */}
        {checkoutCompleted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-cinzel text-xl font-bold text-[#ffd700]">
                Payment Verified &amp; Completed!
              </h3>
              <p className="text-xs text-[#d6c7a7] mt-1.5">
                Thank you for your order. Your digital editions (PDF, EPUB, &amp; Audiobooks) have been deposited to your personal library.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#1d0d36] border border-[#d4af37]/30 text-xs text-left w-full space-y-1">
              <div className="flex justify-between text-[#c9b78e]">
                <span>Recipient:</span>
                <span className="font-semibold text-[#f5ebd7]">{customerEmail}</span>
              </div>
              <div className="flex justify-between text-[#c9b78e]">
                <span>Status:</span>
                <span className="text-emerald-400 font-bold uppercase font-mono">Completed</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutCompleted(false);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#d4af37] text-[#120722] font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-98 transition-all"
            >
              Go to My Digital Library
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
              {items.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-[#d4af37]/30" />
                  <p className="font-cinzel text-base text-[#f5ebd7]">Your cart is empty</p>
                  <p className="text-xs text-[#a89679]">
                    Explore our eight collections and select inspirational volumes for instant download.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.book.id}
                    className="p-3 rounded-xl bg-[#220d3d]/60 border border-[#d4af37]/20 flex items-center gap-3"
                  >
                    <div className="w-14 h-18 rounded overflow-hidden bg-[#0a0314] shrink-0 border border-white/10">
                      <img
                        src={item.book.coverUrl}
                        alt={item.book.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-cinzel text-xs font-bold text-[#f5ebd7] truncate">
                        {item.book.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[#fae8a4] mt-0.5">
                        <span className="font-mono font-bold">${item.book.price.toFixed(2)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          {item.book.formats.includes('Audiobook') ? (
                            <>
                              <Headphones className="w-3 h-3 text-[#ffd700]" />
                              <span>Ebook + Audio</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3 h-3 text-[#ffd700]" />
                              <span>PDF / EPUB</span>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-[#120722] px-2 py-0.5 rounded border border-[#d4af37]/20 text-xs">
                          <button
                            onClick={() => onUpdateQuantity(item.book.id, -1)}
                            className="text-[#ffd700] px-1 hover:text-white"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-semibold px-1">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.book.id, 1)}
                            className="text-[#ffd700] px-1 hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.book.id)}
                          className="text-[#f87171] hover:text-rose-300 p-1"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Email & Name Input for Delivery */}
            {items.length > 0 && (
              <div className="pt-3 border-t border-[#d4af37]/15 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#fae8a4]">
                  Digital Delivery Email
                </span>
                <div className="space-y-1.5">
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Enter your email for digital library delivery..."
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-2 text-xs text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name (optional)..."
                    className="w-full bg-[#1b0a31] border border-[#d4af37]/30 rounded-xl px-3 py-1.5 text-xs text-[#f5ebd7] focus:outline-none focus:border-[#ffd700]"
                  />
                </div>

                {errorMessage && (
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-[11px] text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Subtotal & PayPal Checkout */}
            <div className="pt-3 border-t border-[#d4af37]/20 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#c9b78e]">Total Order Amount:</span>
                <span className="font-mono text-xl font-bold text-[#ffd700] tabular-nums">
                  ${subtotal.toFixed(2)} USD
                </span>
              </div>

              {/* PayPal Trinidad and Tobago and Global Notice */}
              <div className="p-2.5 rounded-xl bg-[#230d3d] border border-[#d4af37]/30 text-[11px] text-[#e6d8ba] space-y-1">
                <div className="flex items-center gap-1.5 text-[#ffd700] font-semibold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Secure PayPal Digital Checkout</span>
                </div>
                <p className="text-[10px] text-[#c9b78e] leading-snug">
                  Worldwide cards &amp; PayPal balances accepted. Supports Trinidad &amp; Tobago merchant accounts with instant USD settlement.
                </p>
              </div>

              <button
                onClick={handlePayPalCheckout}
                disabled={items.length === 0 || isProcessing}
                className="w-full py-3 rounded-xl bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold text-xs uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying PayPal Payment...</span>
                  </>
                ) : (
                  <>
                    <span className="font-serif italic font-bold text-sm">Pay</span>
                    <span className="font-sans font-bold text-sm text-[#003087] bg-white px-1 rounded">Pal</span>
                    <span className="ml-1">Checkout · ${subtotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
