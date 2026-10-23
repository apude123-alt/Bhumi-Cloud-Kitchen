import React, { useState } from 'react';
import {
  Search,
  X,
  MapPin,
  FileText,
  ShieldCheck,
  Phone,
  Clock,
  Sparkles,
  Utensils,
  Coffee,
  UtensilsCrossed,
  Moon,
  Cookie,
  Flame,
  ChevronDown,
  ChevronUp,
  Building2,
  Info
} from 'lucide-react';
import { RestaurantDetails } from '../firebase';

interface CategoryBarProps {
  categories?: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  dietaryFilter: 'all' | 'veg' | 'non-veg';
  onDietaryFilterChange: (diet: 'all' | 'veg' | 'non-veg') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  restaurantDetails?: RestaurantDetails | null;
  onOpenTerms?: () => void;
}

// All Official Kitchen Hubs & Operational Addresses
export const KITCHEN_ADDRESSES = [
  {
    id: 'jamshedpur-main',
    name: 'Main Central Kitchen (Registered Premises)',
    shortName: 'Northern Town Kitchen',
    address: 'Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur, Jharkhand 831001, India',
    locality: 'Northern Town, Jamshedpur',
    phone: '+91 9006759560',
    type: 'Primary Kitchen & Prep Station',
    badge: 'Headquarters & Cooking Hub',
    timings: '05:00 AM – 11:50 PM'
  },
  {
    id: 'sidhgora-dispatch',
    name: 'Sidhgora Cloud Hub & Fleet Dispatch Unit',
    shortName: 'Sidhgora Hub',
    address: '326 Bara Flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
    locality: 'Sidhgora, Jamshedpur',
    phone: '+91 9006759560',
    type: 'Central Fleet & Express Delivery Hub',
    badge: 'Express Dispatch Unit',
    timings: '05:00 AM – 11:50 PM'
  },
  {
    id: 'coochbehar-hub',
    name: 'North Bengal Regional Kitchen Facility',
    shortName: 'New Cooch Behar Branch',
    address: 'Main Station Rd, New Cooch Behar, West Bengal 736101, India',
    locality: 'New Cooch Behar, West Bengal',
    phone: '+91 9006759560',
    type: 'Regional Cloud Hub',
    badge: 'North Bengal Branch',
    timings: '06:00 AM – 11:00 PM'
  }
];

// Specific Terms and Conditions for Each Food Category
const CATEGORY_TERMS_MAP: Record<
  string,
  {
    tagline: string;
    prepRule: string;
    slaTime: string;
    cancellationRule: string;
    packagingStandard: string;
    oilStandard: string;
  }
> = {
  'All Time': {
    tagline: 'Authentic homestyle dishes prepared fresh on order with pure traditional ingredients.',
    prepRule: 'Cooked in small homestyle batches. No artificial MSG, colors, or chemical preservatives.',
    slaTime: 'Standard preparation time: 15–20 minutes before rider pickup.',
    cancellationRule: 'Free cancellation allowed within 5 minutes of placing order before cooking begins.',
    packagingStandard: 'Eco-friendly, spill-proof, tamper-evident food grade thermal containers.',
    oilStandard: '100% pure cold-pressed kachi ghani mustard oil and pure cow ghee.'
  },
  BEVERAGES: {
    tagline: 'Freshly brewed teas, coffees, and cooling natural beverages.',
    prepRule: 'Prepared on demand with whole fresh milk, authentic tea leaves, ginger, and green tea options.',
    slaTime: 'Fresh brew time: 8–12 minutes. Delivered in insulated heat-retention cups.',
    cancellationRule: 'Cancellation allowed within 3 minutes of order placement.',
    packagingStandard: 'Double-walled spill-proof sealed hot/cold beverage cups.',
    oilStandard: 'Dairy & natural ingredients sourced fresh daily.'
  },
  LUNCH: {
    tagline: 'Fresh afternoon thalis, aromatic rice, homestyle lentils, and regional curries.',
    prepRule: 'Lentils & vegetables cooked fresh daily for midday dining; never served from frozen storage.',
    slaTime: 'Lunch order cooking & packing SLA: 18–22 minutes.',
    cancellationRule: 'Cancellations accepted within 5 minutes before frying/cooking commences.',
    packagingStandard: 'Compartmentalized spill-resistant thali containers preserving distinct flavors.',
    oilStandard: 'Pure cold-pressed mustard oil with authentic Bengali & Bihari seasoning.'
  },
  DINNER: {
    tagline: 'Wholesome evening feasts, hot tawa rotis, aromatic biryanis, and comforting dals.',
    prepRule: 'Hot rotis and breads rolled and baked live right before packaging.',
    slaTime: 'Dinner prep SLA: 20 minutes. Dispatched in insulated thermal carrier bags.',
    cancellationRule: 'Cancellation permitted within 5 minutes of placing order.',
    packagingStandard: 'Aluminium foil lined moisture-controlled boxes to keep rotis soft and hot.',
    oilStandard: 'Slow-cooked in cold-pressed mustard oil and aromatic whole spices.'
  },
  BREAKFAST: {
    tagline: 'Early morning hearty homestyle breakfast delicacies and light morning snacks.',
    prepRule: 'Doughs and batters fermented naturally without chemical leaveners.',
    slaTime: 'Breakfast quick prep SLA: 12–15 minutes.',
    cancellationRule: 'Free cancellation within 5 minutes of placing order.',
    packagingStandard: 'Crispness-retaining breathable food paper liners and sealed boxes.',
    oilStandard: 'Pure ghee and premium groundnut/mustard oils.'
  },
  SNACKS: {
    tagline: 'Crispy homestyle fritters, samosas, and evening tea accompaniments.',
    prepRule: 'Fried only once in fresh oil upon order receipt; oil is never reused for frying.',
    slaTime: 'Snacks frying and seasoning SLA: 12–18 minutes.',
    cancellationRule: 'Cancellation allowed within 4 minutes of placing order.',
    packagingStandard: 'Ventilated food-grade bags preventing steam sogginess.',
    oilStandard: 'Single-use pure cooking oil following strict FSSAI safety norms.'
  },
  THALI: {
    tagline: 'Complete traditional meals with balanced carbs, proteins, vegetables, and chutneys.',
    prepRule: 'Multi-item feast prepared strictly in hygienic stainless steel cookware.',
    slaTime: 'Multi-course assembly & thermal sealing SLA: 20 minutes.',
    cancellationRule: 'Free cancellation within 5 minutes before cooking begins.',
    packagingStandard: 'Multi-compartment sealed tray with leak-proof foil sealing.',
    oilStandard: 'Traditional cold-pressed mustard oil and pure desi ghee.'
  },
  DESSERT: {
    tagline: 'Traditional sweet finishes made with pure milk reduction and jaggery/sugar.',
    prepRule: 'Authentic recipes with zero artificial sweeteners or synthetic essences.',
    slaTime: 'Chilled/fresh packing SLA: 8–10 minutes.',
    cancellationRule: 'Cancellation allowed within 5 minutes of order placement.',
    packagingStandard: 'Spill-tight dessert tubs with tamper seal.',
    oilStandard: 'Pure cow milk, cottage cheese (chhena), and desi ghee.'
  }
};

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories = ['All Time', 'BEVERAGES', 'LUNCH', 'DINNER', 'BREAKFAST', 'SNACKS', 'THALI', 'DESSERT'],
  selectedCategory,
  onSelectCategory,
  dietaryFilter,
  onDietaryFilterChange,
  searchQuery,
  onSearchChange,
  restaurantDetails,
  onOpenTerms
}) => {
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [showCategoryTerms, setShowCategoryTerms] = useState(true);

  // Normalize category lookup for conditions
  const categoryTerms =
    CATEGORY_TERMS_MAP[selectedCategory] ||
    CATEGORY_TERMS_MAP[selectedCategory.toUpperCase()] ||
    CATEGORY_TERMS_MAP['All Time'];

  const fssaiNumber = restaurantDetails?.fassaiLicenseNo || '12345678901233';

  // Category Icon Resolver
  const getCategoryIcon = (cat: string) => {
    const c = cat.toUpperCase();
    if (c.includes('BEVERAGE') || c.includes('TEA') || c.includes('COFFEE')) return Coffee;
    if (c.includes('LUNCH')) return UtensilsCrossed;
    if (c.includes('DINNER')) return Moon;
    if (c.includes('BREAKFAST')) return Sparkles;
    if (c.includes('SNACK')) return Cookie;
    if (c.includes('THALI')) return Utensils;
    if (c.includes('DESSERT')) return Flame;
    return Utensils;
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Category Selector Pills - NO LOGIN REQUIRED */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Select Category (Browse Freely)
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Selected: <strong>{selectedCategory}</strong>
          </span>
        </div>

        {/* Scrollable Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const IconComp = getCategoryIcon(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'polish-green text-white shadow-xs scale-[1.02]'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-stone-500'}`} />
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Category Terms & Conditions Card */}
      <div className="bg-gradient-to-r from-emerald-50/90 via-stone-50 to-amber-50/70 border border-emerald-300/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg polish-green text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                <span>{selectedCategory} Category Terms & Conditions</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  FSSAI Verified
                </span>
              </h3>
              <p className="text-[11px] text-stone-600 font-medium">
                {categoryTerms.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {onOpenTerms && (
              <button
                type="button"
                onClick={onOpenTerms}
                className="text-[11px] font-bold text-emerald-900 underline hover:text-emerald-700 cursor-pointer"
              >
                View Full Legal Terms
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCategoryTerms(!showCategoryTerms)}
              className="p-1 rounded-lg text-stone-600 hover:bg-white/80 transition cursor-pointer"
              title="Toggle terms details"
            >
              {showCategoryTerms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showCategoryTerms && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <span>🔥 Preparation Standard</span>
              </span>
              <p className="text-[11px] text-stone-700 leading-snug">{categoryTerms.prepRule}</p>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <span>⏱️ Cooking SLA & Freshness</span>
              </span>
              <p className="text-[11px] text-stone-700 leading-snug">{categoryTerms.slaTime}</p>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <span>🛍️ Tamper-Proof Packaging</span>
              </span>
              <p className="text-[11px] text-stone-700 leading-snug">{categoryTerms.packagingStandard}</p>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200/70 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                <span>⏱️ 5-Min Cancellation Policy</span>
              </span>
              <p className="text-[11px] text-stone-700 leading-snug">{categoryTerms.cancellationRule}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. All Kitchen Operating Addresses Card */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <span>Bhumi Cloud Kitchen • All Operating Kitchen Addresses</span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  3 Active Kitchens
                </span>
              </h4>
              <p className="text-[11px] text-stone-600">
                Registered under FSSAI Lic No. <strong className="text-emerald-900 font-mono">{fssaiNumber}</strong> • Food cooked live at official kitchen premises
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <a
              href="tel:+919006759560"
              className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition inline-flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-emerald-700" />
              <span>Call Kitchen: +91 9006759560</span>
            </a>
            <button
              type="button"
              onClick={() => setShowAllAddresses(!showAllAddresses)}
              className="p-1 rounded-lg text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              title="Toggle kitchen addresses view"
            >
              {showAllAddresses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Kitchen Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {KITCHEN_ADDRESSES.map((k) => (
            <div
              key={k.id}
              className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    {k.badge}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Kitchen
                  </span>
                </div>
                <h5 className="font-extrabold text-stone-900 text-xs">{k.name}</h5>
                <p className="text-[11px] text-stone-600 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{k.address}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] font-medium text-stone-500">
                <span className="flex items-center gap-1 text-stone-700">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>{k.timings}</span>
                </span>
                <span className="font-semibold text-emerald-800">{k.locality}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Search Bar & Dietary Segmented Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder={`Search dishes in ${selectedCategory} (e.g. Biryani, Luchi, Tea, Thali)...`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-stone-200/90 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onDietaryFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              dietaryFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => onDietaryFilterChange('veg')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              dietaryFilter === 'veg'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
            </span>
            <span>Pure Veg</span>
          </button>
          <button
            onClick={() => onDietaryFilterChange('non-veg')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              dietaryFilter === 'non-veg'
                ? 'bg-white text-red-800 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded border border-red-600 flex items-center justify-center p-0.5">
              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600 block" />
            </span>
            <span>Non-Veg</span>
          </button>
        </div>
      </div>
    </div>
  );
};
