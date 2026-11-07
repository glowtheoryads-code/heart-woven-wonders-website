import React from 'react';
import { Globe, Download, Headphones, ShieldCheck } from 'lucide-react';

interface AnnouncementStripProps {
  text?: string;
}

export const AnnouncementStrip: React.FC<AnnouncementStripProps> = ({
  text = 'Worldwide digital deliveries | Instant PDF & EPUB downloads | Audiobooks available | Secure PayPal payments',
}) => {
  return (
    <div className="bg-gradient-to-r from-[#170a29] via-[#2d1252] to-[#170a29] border-b border-[#d4af37]/25 text-[#f5ebd7] py-2 px-4 text-xs tracking-wide">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-6 mx-auto text-center font-medium">
          <div className="flex items-center gap-1.5 text-[#e5c158]">
            <Globe className="w-3.5 h-3.5" />
            <span>Worldwide digital deliveries</span>
          </div>
          <span className="text-[#d4af37]/40">✦</span>
          <div className="flex items-center gap-1.5 text-[#f3d46d]">
            <Download className="w-3.5 h-3.5" />
            <span>Instant PDF &amp; EPUB downloads</span>
          </div>
          <span className="text-[#d4af37]/40">✦</span>
          <div className="flex items-center gap-1.5 text-[#f3d46d]">
            <Headphones className="w-3.5 h-3.5" />
            <span>Audiobooks available</span>
          </div>
          <span className="text-[#d4af37]/40">✦</span>
          <div className="flex items-center gap-1.5 text-[#ffd700]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure PayPal payments</span>
          </div>
        </div>
        <div className="sm:hidden text-center w-full font-medium text-[#fae8a4] truncate">
          {text}
        </div>
      </div>
    </div>
  );
};
