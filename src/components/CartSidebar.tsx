import React, { useState, useEffect } from 'react';
import { CartItem, Coupon, UserProfile } from '../types';
import { COUPONS } from '../data/defaultMenu';
import { Trash2, Plus, Minus, Tag, Check, ArrowRight, ShieldCheck, Banknote, QrCode, Phone } from 'lucide-react';

interface CartSidebarProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number, variantId?: string) => void;
  onRemoveItem: (itemId: string, variantId?: string) => void;
  onClearCart: () => void;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
  onPlaceOrder: (customerData: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: 'Cash on Delivery' | 'UPI / Online';
    cookingNotes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  currentUser?: UserProfile | null;
  onOpenLogin?: () => void;
  onOpenTerms?: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  appliedCoupon,
  onApplyCoupon,
  onPlaceOrder,
  isSubmitting,
  currentUser,
  onOpenLogin,
  onOpenTerms
}) => {
  const [name, setName] = useState(() => localStorage.getItem('bhumi_cust_name') || 'Apu De');
  const [phone, setPhone] = useState(() => localStorage.getItem('bhumi_cust_phone') || '9006759560');
  const [address, setAddress] = useState(
    () => localStorage.getItem('bhumi_cust_addr') || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India'
  );
  const [cookingNotes, setCookingNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI / Online'>('Cash on Delivery');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Sync with logged-in user profile
  useEffect(() => {
    if (currentUser?.isLoggedIn) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone.replace(/\D/g, '').slice(-10));
      if (currentUser.savedAddress) setAddress(currentUser.savedAddress);
    }
  }, [currentUser]);

  // Subtotal calculation supporting selected variant prices
  const subtotal = items.reduce((sum, ci) => {
    const itemPrice = ci.selectedVariant ? ci.selectedVariant.price : ci.item.price;
    return sum + itemPrice * ci.quantity;
  }, 0);

  // Delivery charge calculation
  let deliveryFee = subtotal > 0 ? 30 : 0;
  let discount = 0;

  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.code === 'FREEDEL') {
      deliveryFee = 0;
    } else if (appliedCoupon.discountType === 'flat') {
      discount = Math.min(appliedCoupon.discountValue, subtotal);
    } else if (appliedCoupon.discountType === 'percentage') {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      discount = Math.min(discount, 80); // Cap at 80
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee - discount);

  const handleApplyCouponCode = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) return;

    const found = COUPONS.find((c) => c.code.toUpperCase() === code);
    if (!found) {
      setCouponError('Invalid coupon code.');
      return;
    }

    if (subtotal < found.minOrder) {
      setCouponError(`Min order of ₹${found.minOrder} required for ${found.code}.`);
      return;
    }

    setCouponError(null);
    onApplyCoupon(found);
    setCouponInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (!name.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!address.trim()) {
      alert('Please enter your delivery address');
      return;
    }

    // Persist details for future orders
    localStorage.setItem('bhumi_cust_name', name.trim());
    localStorage.setItem('bhumi_cust_phone', phone.trim());
    localStorage.setItem('bhumi_cust_addr', address.trim());

    onPlaceOrder({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod,
      cookingNotes: cookingNotes.trim()
    });
  };

  return (
    <aside
      id="cartSidebar"
      className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200/80 h-fit sticky top-6"
    >
      <div className="flex justify-between items-center border-b border-stone-100 pb-3 mb-3">
        <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
          <span>Your Cart Summary</span>
          {items.length > 0 && (
            <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-bold">
              {items.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          )}
        </h2>
      </div>

      {/* Cart Items List */}
      <div className="space-y-2.5 mb-4 max-h-60 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="py-8 text-center text-stone-400 space-y-1">
            <p className="text-xs font-semibold text-stone-500">Your cart is empty</p>
            <p className="text-[11px]">Tap ADD on any dish to begin your feast!</p>
          </div>
        ) : (
          items.map(({ item, quantity, selectedVariant }) => {
            const unitPrice = selectedVariant ? selectedVariant.price : item.price;
            const itemKey = `${item.id}_${selectedVariant?.variantId || 'base'}`;

            return (
              <div
                key={itemKey}
                className="flex justify-between items-center bg-stone-50/80 p-2.5 rounded-xl border border-stone-200/50"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-semibold text-xs text-stone-900 truncate">{item.name}</p>
                  {selectedVariant ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                        {selectedVariant.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-medium">₹{unitPrice} each</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-stone-500">₹{unitPrice} each</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-xs text-stone-900">
                    ₹{unitPrice * quantity}
                  </span>

                  <div className="flex items-center bg-white border border-stone-200 rounded-lg shadow-2xs">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1, selectedVariant?.variantId)}
                      className="p-1 hover:bg-stone-100 text-stone-600 rounded-l transition cursor-pointer"
                      aria-label="Decrease"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-4 text-center text-[11px] font-bold text-stone-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1, selectedVariant?.variantId)}
                      className="p-1 hover:bg-stone-100 text-stone-600 rounded-r transition cursor-pointer"
                      aria-label="Increase"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.id, selectedVariant?.variantId)}
                    className="text-stone-300 hover:text-red-600 p-1 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <>
          {/* Coupon Code Section */}
          <div className="mb-3 pt-1 border-t border-stone-100">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{appliedCoupon.code} applied!</span>
                </div>
                <button
                  onClick={() => onApplyCoupon(null)}
                  className="text-[11px] text-emerald-700 hover:text-red-700 font-semibold underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME100)"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError(null);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg uppercase font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    onClick={() => handleApplyCouponCode()}
                    className="polish-green text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#23482e] transition"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                )}
                {/* Clickable Quick Coupon chips */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar pt-1">
                  {COUPONS.slice(0, 3).map((cp) => (
                    <button
                      key={cp.code}
                      onClick={() => handleApplyCouponCode(cp.code)}
                      className="text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold whitespace-nowrap"
                    >
                      🏷️ {cp.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="border-t border-stone-100 pt-3 space-y-1.5 text-xs font-semibold text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between text-stone-500">
              <span>Delivery Fee (Within 6km):</span>
              <span>
                {deliveryFee === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  `₹${deliveryFee}`
                )}
              </span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount:</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-stone-900 border-t border-stone-200 pt-2.5 mt-1.5">
              <span>Total Payable:</span>
              <span className="text-emerald-900 text-base">₹{grandTotal}</span>
            </div>
          </div>

          {/* Customer Delivery Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-2 border-t border-stone-100 pt-3">
            {!currentUser?.isLoggedIn && (
              <div className="bg-amber-50/80 border border-amber-200/90 p-2.5 rounded-xl flex justify-between items-center text-xs mb-2 shadow-2xs">
                <div>
                  <p className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-amber-700" />
                    <span>Login with Mobile</span>
                  </p>
                  <p className="text-amber-700 text-[10px]">1-tap checkout & saved address</p>
                </div>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="polish-green hover:bg-[#23482e] text-white px-2.5 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer"
                >
                  Verify OTP
                </button>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name (e.g. Apu De)"
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                Mobile Number (+91)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                Delivery Address & Landmark
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, House No., Street, Landmark"
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                Cooking Instructions (Optional)
              </label>
              <input
                type="text"
                value={cookingNotes}
                onChange={(e) => setCookingNotes(e.target.value)}
                placeholder="e.g. Less spicy, extra salad/lemon"
                className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cash on Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI / Online')}
                  className={`py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border transition ${
                    paymentMethod === 'UPI / Online'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-stone-200 bg-stone-50 text-stone-600'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                  <span>UPI / QR Pay</span>
                </button>
              </div>
            </div>

            {/* Mandatory Checkbox for Terms & Conditions */}
            {/* Transparent Terms & FSSAI Info (No acceptance required) */}
            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between text-[11px] text-stone-600 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>FSSAI Certified Fresh Cooking</span>
                </span>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-emerald-800 underline font-bold hover:text-emerald-950 cursor-pointer text-[11px]"
                >
                  View Terms
                </button>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 saffron-orange hover:bg-[#e65c00] active:scale-[0.98] text-white py-3 rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Placing Your Feast Order...</span>
              ) : (
                <>
                  <span>
                    PLACE ORDER ({paymentMethod === 'Cash on Delivery' ? 'COD' : 'UPI'}) • ₹{grandTotal}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Sanitized Kitchen Delivery • Contactless</span>
            </div>
          </form>
        </>
      )}
    </aside>
  );
};
