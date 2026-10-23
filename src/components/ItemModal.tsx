import React, { useState, useEffect } from 'react';
import { MenuItem, ItemVariant } from '../types';
import { X, Star, Clock, Users, Flame, Plus, Minus } from 'lucide-react';

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  quantityInCart: number;
  onAddToCart: (item: MenuItem, variant?: ItemVariant) => void;
  onRemoveFromCart: (itemId: string, variantId?: string) => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  item,
  onClose,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | undefined>(undefined);

  useEffect(() => {
    if (item && item.variants && item.variants.length > 0) {
      setSelectedVariant(item.variants[0]);
    } else {
      setSelectedVariant(undefined);
    }
  }, [item]);

  if (!item) return null;

  const isVeg = item.dietary === 'veg';
  const hasVariants = item.variants && item.variants.length > 0;
  const currentPrice = selectedVariant ? selectedVariant.price : item.price;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        {/* Top Image */}
        <div className="relative aspect-16/10 bg-stone-100 shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600';
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full backdrop-blur-xs transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs">
              {isVeg ? (
                <span className="w-3.5 h-3.5 rounded border border-emerald-600 flex items-center justify-center p-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 block" />
                </span>
              ) : (
                <span className="w-3.5 h-3.5 rounded border border-red-600 flex items-center justify-center p-0.5">
                  <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600 block" />
                </span>
              )}
            </span>
            <span className="bg-stone-900/80 backdrop-blur-xs text-amber-300 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
              <span>{item.rating.toFixed(1)}</span>
              {item.ratingCount && <span className="text-stone-300 text-[10px]">({item.ratingCount}+)</span>}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-stone-900 leading-tight">{item.name}</h2>
              <div className="text-right">
                <span className="text-xl font-black text-stone-900">₹{currentPrice}</span>
                {item.originalPrice && (
                  <p className="text-xs text-stone-400 line-through">₹{item.originalPrice}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-stone-500 mt-2 leading-relaxed">{item.description}</p>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-100 text-center">
            {item.portion && (
              <div className="p-2 bg-stone-50 rounded-xl">
                <Users className="w-3.5 h-3.5 mx-auto text-emerald-700 mb-1" />
                <p className="text-[10px] text-stone-400">Portion</p>
                <p className="text-xs font-bold text-stone-800">{item.portion}</p>
              </div>
            )}
            <div className="p-2 bg-stone-50 rounded-xl">
              <Clock className="w-3.5 h-3.5 mx-auto text-emerald-700 mb-1" />
              <p className="text-[10px] text-stone-400">Prep Time</p>
              <p className="text-xs font-bold text-stone-800">{item.prepTimeMinutes || 20} mins</p>
            </div>
            <div className="p-2 bg-stone-50 rounded-xl">
              <Flame className="w-3.5 h-3.5 mx-auto text-amber-600 mb-1" />
              <p className="text-[10px] text-stone-400">Spice Level</p>
              <p className="text-xs font-bold text-stone-800">{item.spiceLevel || 'Medium'}</p>
            </div>
          </div>

          {/* Dropdown Selection for Item Variants */}
          {hasVariants && (
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/90 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-stone-800">
                <span>Select Variant / Size by Dropdown:</span>
                <span className="text-emerald-800 font-extrabold">{selectedVariant?.name} (₹{currentPrice})</span>
              </div>
              <select
                value={selectedVariant?.variantId || selectedVariant?.name || ''}
                onChange={(e) => {
                  const found = item.variants?.find(
                    (v) => (v.variantId || v.name) === e.target.value
                  );
                  if (found) setSelectedVariant(found);
                }}
                className="w-full text-xs font-semibold bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 cursor-pointer"
              >
                {item.variants!.map((v) => (
                  <option key={v.variantId || v.name} value={v.variantId || v.name}>
                    {v.name} — ₹{v.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ingredients list */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide mb-2">
                Fresh Ingredients & Spices
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-between items-center shrink-0">
          <div className="text-xs text-stone-500">
            Freshly prepared upon your order
          </div>

          <div className="flex items-center gap-3">
            {quantityInCart > 0 ? (
              <div className="polish-green text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-3 shadow-xs">
                <button
                  onClick={() => onRemoveFromCart(item.id, selectedVariant?.variantId)}
                  className="hover:bg-emerald-800 p-0.5 rounded transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-black">{quantityInCart}</span>
                <button
                  onClick={() => onAddToCart(item, selectedVariant)}
                  className="hover:bg-emerald-800 p-0.5 rounded transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(item, selectedVariant)}
                className="polish-green hover:bg-[#23482e] active:scale-95 text-white text-xs px-6 py-2.5 rounded-xl font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ADD TO CART • ₹{currentPrice}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
