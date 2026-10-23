import React from 'react';
import { UserProfile, UserRole } from '../types';
import { ShieldCheck, Globe, CheckCircle2, FileText } from 'lucide-react';

interface HeaderProps {
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  onOpenAccount?: () => void;
  fssaiNo?: string;
  onOpenTerms?: () => void;
  activePortalView?: UserRole;
  onSelectPortalView?: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  fssaiNo = '12345678901233',
  onOpenTerms,
}) => {
  return (
    <header className="bg-white px-5 sm:px-6 py-4 rounded-3xl shadow-xs border border-stone-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Brand & Identity with Prominently Sized Logo */}
      <div className="flex items-center space-x-4 sm:space-x-5">
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Bhumi Cloud Kitchen • www.bhumicloudkitchen.com"
        >
          {/* Bigger Logo Container - untouched original uploaded graphic */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-sm border border-stone-200/90 bg-[#FDFBF7] p-1 flex items-center justify-center transition group-hover:scale-105 duration-200">
            <img
              src="/bhumi_logo.jpg"
              alt="Bhumi Cloud Kitchen Logo - www.bhumicloudkitchen.com"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs"
            title="Kitchen Live & Taking Orders"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-900">
              Bhumi Cloud Kitchen
            </h1>
            <a
              href="https://www.bhumicloudkitchen.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition"
              title="Official Website: www.bhumicloudkitchen.com"
            >
              <Globe className="w-3 h-3 text-emerald-700" />
              <span>www.bhumicloudkitchen.com</span>
            </a>
          </div>

          <p className="text-xs text-stone-600 font-medium">
            <span className="text-emerald-800 font-bold">Authentic Homestyle Feast</span>
            <span className="text-stone-300 mx-1.5">·</span>
            <span className="text-[#78350f] font-semibold italic">Rooted in Nature</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600 pt-0.5">
            <button
              onClick={onOpenTerms}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-stone-600 hover:text-emerald-800 hover:underline cursor-pointer bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200"
              title="Click to view FSSAI Food Safety Compliance and Terms"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>FSSAI: {fssaiNo}</span>
            </button>
            <span className="text-stone-300">·</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Order Delivery</span>
            </span>
          </div>
        </div>
      </div>

      {/* Domain & Terms & Conditions Action */}
      <div className="flex flex-col sm:items-end text-left sm:text-right space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono font-bold text-stone-800">www.bhumicloudkitchen.com</span>
        </div>
        <button
          onClick={onOpenTerms}
          className="polish-green text-white hover:bg-[#23482e] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="View Official Terms & Conditions"
        >
          <FileText className="w-3.5 h-3.5 text-amber-300" />
          <span>Terms & Conditions</span>
        </button>
      </div>
    </header>
  );
};

