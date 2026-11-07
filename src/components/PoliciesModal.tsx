import React, { useState } from 'react';
import { StorePolicy } from '../types';
import { BookOpen, ShieldCheck, HelpCircle, Mail, FileText, X } from 'lucide-react';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  policies: StorePolicy[];
  initialPolicyId?: string;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({
  isOpen,
  onClose,
  policies,
  initialPolicyId,
}) => {
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    initialPolicyId || (policies[0] ? policies[0].id : '')
  );

  if (!isOpen) return null;

  const activePolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative bg-gradient-to-b from-[#1c0c32] via-[#140825] to-[#0d0519] border border-[#d4af37]/45 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl text-[#f5ebd7] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#d4af37]/25 flex items-center justify-between bg-gradient-to-r from-[#210c3d] via-[#2e1152] to-[#210c3d]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#ffd700]" />
            <h3 className="font-cinzel text-lg font-bold text-[#ffd700]">
              Publisher Information &amp; Sanctuary Policies
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#fae8a4] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Policy Navigation Sidebar */}
          <div className="w-full md:w-64 bg-[#140726] border-r border-[#d4af37]/20 p-4 space-y-1.5 overflow-y-auto">
            {policies.map((pol) => {
              const isSelected = activePolicy?.id === pol.id;
              return (
                <button
                  key={pol.id}
                  onClick={() => setSelectedPolicyId(pol.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#3b1767] text-[#ffd700] border border-[#d4af37]/40 shadow-inner'
                      : 'text-[#d6c7a7] hover:bg-white/5 hover:text-[#ffd700]'
                  }`}
                >
                  <span className="truncate">{pol.title}</span>
                </button>
              );
            })}
          </div>

          {/* Policy Content Viewer */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-4 bg-[#120621]/90">
            {activePolicy ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-cinzel text-2xl font-bold text-[#ffd700]">
                    {activePolicy.title}
                  </h2>
                  <p className="text-[11px] text-[#a89679] mt-0.5">
                    Official Publishing House Policy · Last verified {new Date(activePolicy.lastUpdated).toLocaleDateString()}
                  </p>
                </div>

                <div className="h-[1px] w-24 bg-gradient-to-r from-[#d4af37] to-transparent my-2" />

                <div className="text-xs sm:text-sm text-[#e6d8ba] leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                  {activePolicy.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-[#a89679]">
                Select a policy on the left to read details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
