import React, { useState } from 'react';
import { MenuItem, ItemVariant } from '../types';
import { Star, Plus, Minus, Info } from 'lucide-react';

interface MenuGridProps {
  items: MenuItem[];
  cartItemCounts: Record<string, number>;
  onAddToCart: (item: MenuItem, variant?: ItemVariant) => void;
  onRemoveFromCart: (itemId: string, variantId?: string) => void;
  onViewItemDetails: (item: MenuItem) => void;
  isLoading: boolean;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  items,
  cartItemCounts,
  onAddToCart,
  onRemoveFromCart,
  onViewItemDetails,
  isLoading
}) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ItemVariant>>({});

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white p-3.5 rounded-2xl border border-stone-200/60 animate-pulse space-y-3">
            <div className="w-full h-36 bg-stone-200 rounded-xl" />
            <div className="h-4 bg-stone-200 rounded w-3/4" />
            <div className="h-3 bg-stone-200 rounded w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-stone-200 rounded w-16" />
              <div className="h-8 bg-stone-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-10 text-center space-y-2">
        <p className="text-stone-700 font-bold text-sm">No items found</p>
        <p className="text-stone-400 text-xs">
          Try adjusting your search query or selecting a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => {
        const qty = cartItemCounts[item.id] || 0;
        const isVeg = item.dietary === 'veg';

        const hasVariants = item.variants && item.variants.length > 0;
        const activeVariant: ItemVariant | undefined =
          selectedVariants[item.id] || (hasVariants ? item.variants![0] : undefined);
        const displayPrice = activeVariant ? activeVariant.price : item.price;

        return (
          <div
            key={item.id}
            className="group bg-white p-3.5 rounded-2xl shadow-2xs hover:shadow-md border border-stone-200/70 transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              {/* Image & Badges */}
              <div className="relative mb-2.5 overflow-hidden rounded-xl bg-stone-100 aspect-16/10">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />

                {/* Dietary Badge */}
                <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs flex items-center gap-1">
                  {isVeg ? (
                    <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5" title="Pure Vegetarian">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded border border-red-600 flex items-center justify-center p-0.5" title="Non-Vegetarian">
                      <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600 block" />
                    </span>
                  )}
                </div>

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 bg-stone-900/80 backdrop-blur-xs text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 shadow-xs">
                  <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                  <span>{item.rating.toFixed(1)}</span>
                </div>

                {/* Portion/Spice tag */}
                {item.portion && (
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-medium">
                    {item.portion}
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h3
                    className="font-bold text-stone-900 text-sm leading-tight hover:text-emerald-800 transition cursor-pointer"
                    onClick={() => onViewItemDetails(item)}
                  >
                    {item.name}
                  </h3>
                  {item.category && item.category !== 'All Time' && (
                    <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block mt-0.5">
                      {item.category}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onViewItemDetails(item)}
                  className="text-stone-400 hover:text-stone-600 p-0.5 rounded shrink-0 cursor-pointer"
                  title="View details & ingredients"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {item.description && (
                <p className="text-stone-500 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Item Variant Dropdown Selector */}
              {hasVariants && (
                <div className="mt-2.5 bg-stone-50 p-2 rounded-xl border border-stone-200/80">
                  <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-stone-700">
                    <span>Select Variant:</span>
                    <span className="text-emerald-800 font-extrabold">{activeVariant?.name}</span>
                  </div>
                  <select
                    value={activeVariant?.variantId || activeVariant?.name || ''}
                    onChange={(e) => {
                      const found = item.variants?.find(
                        (v) => (v.variantId || v.name) === e.target.value
                      );
                      if (found) {
                        setSelectedVariants((prev) => ({ ...prev, [item.id]: found }));
                      }
                    }}
                    className="w-full text-xs font-semibold bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
                  >
                    {item.variants!.map((v) => (
                      <option key={v.variantId || v.name} value={v.variantId || v.name}>
                        {v.name} — ₹{v.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Bottom: Pricing & Cart Controls */}
            <div className="flex justify-between items-center mt-3 pt-2 border-t border-stone-100">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-stone-900">
                  ₹{displayPrice}
                </span>
                {item.originalPrice && item.originalPrice > displayPrice && (
                  <span className="text-[11px] text-stone-400 line-through">
                    ₹{item.originalPrice}
                  </span>
                )}
                {hasVariants && (
                  <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    {item.variants!.length} options
                  </span>
                )}
              </div>

              {qty > 0 ? (
                <div className="polish-green text-white text-xs px-2 py-1 rounded-xl font-bold flex items-center gap-2 shadow-xs">
                  <button
                    onClick={() => onRemoveFromCart(item.id, activeVariant?.variantId)}
                    className="hover:bg-emerald-800 p-0.5 rounded transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-xs font-black">{qty}</span>
                  <button
                    onClick={() => onAddToCart(item, activeVariant)}
                    className="hover:bg-emerald-800 p-0.5 rounded transition cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAddToCart(item, activeVariant)}
                  className="polish-green hover:bg-[#23482e] active:scale-95 text-white text-xs px-4 py-1.5 rounded-xl font-bold shadow-xs transition duration-150 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>ADD</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
