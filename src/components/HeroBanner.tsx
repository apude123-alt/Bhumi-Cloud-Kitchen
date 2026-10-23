import React, { useState, useEffect } from 'react';
import { COUPONS } from '../data/defaultMenu';
import { Sparkles, Check, Copy } from 'lucide-react';
import { Coupon } from '../types';

interface HeroBannerProps {
  kitchenName: string;
  onApplyCoupon: (code: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ kitchenName, onApplyCoupon }) => {
  const [couponIndex, setCouponIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCouponIndex((prev) => (prev + 1) % COUPONS.length);
        setIsAnimating(false);
      }, 400);
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const activeCoupon: Coupon = COUPONS[couponIndex];

  const handleCouponClick = () => {
    onApplyCoupon(activeCoupon.code);
    setCopiedCode(activeCoupon.code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div
      className="relative text-white rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden bg-cover bg-center border border-emerald-950/20"
      style={{
        backgroundImage: `linear-gradient(rgba(18, 38, 24, 0.78), rgba(12, 28, 17, 0.88)), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000')`
      }}
    >
      {/* Decorative ambient subtle glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        {/* Left Side: Greeting, Big Logo & Storefront */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-2 border-amber-300/40 bg-[#FDFBF7] p-1 shrink-0 shadow-lg hidden sm:flex items-center justify-center">
            <img
              src="/bhumi_logo.jpg"
              alt="Bhumi Cloud Kitchen Logo - www.bhumicloudkitchen.com"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl md:text-2xl font-black script-text text-amber-300 tracking-wide drop-shadow-xs">
                {getGreeting()}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-amber-200 text-[11px] font-mono font-bold bg-white/15 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-xs">
                www.bhumicloudkitchen.com
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {kitchenName}
            </h2>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-200 mt-2 font-medium">
              <span className="text-amber-300 font-semibold italic">Rooted in Nature</span>
              <span className="text-stone-400">·</span>
              <span>FSSAI Lic: 12345678901233</span>
              <span className="text-stone-400">·</span>
              <span className="text-emerald-300 font-semibold">Within 6 km Free Delivery</span>
              <span className="text-stone-400">·</span>
              <span>100% Mustard Oil & Pure Ghee Prep</span>
            </div>
          </div>
        </div>

        {/* Right Side: 3-Line Vertical Coupon Ticker (Bottom-to-Top) */}
        <div
          onClick={handleCouponClick}
          className="w-full md:w-auto cursor-pointer group bg-stone-950/60 hover:bg-stone-950/80 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 transition duration-200 shadow-lg text-right select-none"
          title="Click to apply coupon to cart!"
        >
          <div className="flex items-center justify-between md:justify-end gap-3 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Live Offer
            </span>
            <div className="text-[10px] text-stone-300 group-hover:text-amber-300 flex items-center gap-1">
              {copiedCode ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" /> Applied
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="w-2.5 h-2.5" /> Tap to Apply
                </span>
              )}
            </div>
          </div>

          {/* Vertical 3-line ticker container */}
          <div className="h-14 overflow-hidden flex flex-col justify-center">
            <div
              className={`transition-all duration-300 ease-out transform ${
                isAnimating ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              {/* Line 1: Code */}
              <p className="text-base font-black italic text-amber-300 tracking-wider">
                {activeCoupon.title}
              </p>
              {/* Line 2: Benefit */}
              <p className="text-xs font-black italic text-white leading-tight">
                {activeCoupon.subtitle}
              </p>
              {/* Line 3: Min order */}
              <p className="text-[10px] font-semibold italic text-stone-300 leading-tight">
                above ₹{activeCoupon.minOrder}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
