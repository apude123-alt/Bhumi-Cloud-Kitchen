/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, CartItem, Order, Coupon, DietaryType, UserProfile, ItemVariant, OrderStatus, UserRole } from './types';
import { DEFAULT_MENU_ITEMS, COUPONS } from './data/defaultMenu';
import {
  subscribeToMenuItems,
  subscribeToOrders,
  saveOrder,
  subscribeToRestaurantDetails,
  subscribeToRestaurantSettings,
  subscribeToUserProfile,
  updateUserProfileInFirestore,
  updateOrderStatus,
  recordTermsAcceptanceInFirestore,
  RestaurantDetails,
  RestaurantSettings
} from './firebase';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { MenuGrid } from './components/MenuGrid';
import { CartSidebar } from './components/CartSidebar';
import { OrderTracker } from './components/OrderTracker';
import { SupportChat } from './components/SupportChat';
import { ItemModal } from './components/ItemModal';
import { KitchenAdminModal } from './components/KitchenAdminModal';
import { AuthModal } from './components/AuthModal';
import { AccountModal } from './components/AccountModal';
import { TermsModal } from './components/TermsModal';
import {
  CheckCircle2,
  Utensils,
  ChefHat,
  Bike,
  ShieldAlert,
  ShieldCheck,
  FileText,
  ArrowRight,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  User
} from 'lucide-react';

export default function App() {
  // Menu items state
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bhumi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders state - persisted across user session
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    try {
      const saved = localStorage.getItem('bhumi_active_order');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('bhumi_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>('All Time');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // User Account (Direct access profile - login removed across all categories and sections)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('bhumi_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      }
      return {
        phone: '+919006759560',
        name: localStorage.getItem('bhumi_cust_name') || 'Guest Customer',
        role: 'customer',
        isLoggedIn: true,
        termsAccepted: true
      };
    } catch {
      return {
        phone: '+919006759560',
        name: 'Guest Customer',
        role: 'customer',
        isLoggedIn: true,
        termsAccepted: true
      };
    }
  });

  // Dedicated Page / Portal View state: Customer, Kitchen, Rider, Admin
  const [activePortalView, setActivePortalView] = useState<UserRole>(() => {
    const savedRole = (localStorage.getItem('bhumi_role') as UserRole);
    return savedRole || 'customer';
  });

  // UI Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<'profile' | 'orders' | 'kitchen'>('profile');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(null);
  const [restaurantSettings, setRestaurantSettings] = useState<RestaurantSettings | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cartSectionRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Subscribe to live FSSAI license & restaurant settings from Firebase
  useEffect(() => {
    const unsubDetails = subscribeToRestaurantDetails((details) => {
      setRestaurantDetails(details);
    });
    const unsubSettings = subscribeToRestaurantSettings((settings) => {
      setRestaurantSettings(settings);
    });
    return () => {
      if (unsubDetails) unsubDetails();
      if (unsubSettings) unsubSettings();
    };
  }, []);

  // Real-time synchronization with customer profile in Firestore users collection
  useEffect(() => {
    if (!currentUser || !currentUser.isLoggedIn || !currentUser.phone) {
      return;
    }

    const unsubUser = subscribeToUserProfile(currentUser.phone, (liveProfile) => {
      const isLoggedOut = localStorage.getItem('bhumi_logged_out') === 'true';
      if (!isLoggedOut && liveProfile) {
        setCurrentUser(liveProfile);
      }
    });

    return () => {
      if (unsubUser) unsubUser();
    };
  }, [currentUser?.phone, currentUser?.isLoggedIn]);

  // Sync Cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bhumi_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  // Subscribe to live Firestore menu
  useEffect(() => {
    setIsLoadingMenu(true);
    const unsubscribe = subscribeToMenuItems(
      (firestoreItems) => {
        setIsLoadingMenu(false);
        if (firestoreItems && firestoreItems.length > 0) {
          setMenuItems(firestoreItems);
        } else {
          setMenuItems(DEFAULT_MENU_ITEMS);
        }
      },
      () => {
        setIsLoadingMenu(false);
        setMenuItems(DEFAULT_MENU_ITEMS);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time synchronization with Firestore orders collection (Open access across all portals)
  useEffect(() => {
    const isStaff =
      activePortalView === 'kitchen' ||
      activePortalView === 'rider' ||
      activePortalView === 'admin';

    // Staff portals receive all live orders; customer tracks orders placed on their number or session
    const savedCustomerPhone =
      localStorage.getItem('bhumi_cust_phone') || currentUser?.phone || null;
    const filterPhone = isStaff
      ? null
      : savedCustomerPhone
      ? (savedCustomerPhone.startsWith('+91')
          ? savedCustomerPhone
          : '+91' + savedCustomerPhone.replace(/\D/g, ''))
      : null;

    const unsubscribe = subscribeToOrders(filterPhone, (firestoreOrders) => {
      if (firestoreOrders && firestoreOrders.length > 0) {
        setOrderHistory(firestoreOrders);
        setActiveOrder((prev) => {
          if (prev) {
            const matched = firestoreOrders.find((o) => o.orderId === prev.orderId);
            return matched || firestoreOrders[0];
          }
          return firestoreOrders[0];
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activePortalView, currentUser?.phone]);

  // Distinct menu categories list
  const allCategories = useMemo(() => {
    const defaultList = ['All Time', 'BREAKFAST', 'LUNCH', 'DINNER', 'BEVERAGES', 'SNACKS', 'THALI', 'DESSERT'];
    const dynamicList = new Set<string>(defaultList);
    menuItems.forEach((item) => {
      if (item.category) dynamicList.add(item.category);
      if (item.categories) item.categories.forEach((c) => dynamicList.add(c));
    });
    return Array.from(dynamicList);
  }, [menuItems]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All Time'
          ? true
          : item.categories
          ? item.categories.includes(selectedCategory)
          : item.category === selectedCategory;

      const isItemVeg = item.isVeg === true || item.dietary === 'veg';
      const matchesDietary =
        dietaryFilter === 'all' ? true : dietaryFilter === 'veg' ? isItemVeg : !isItemVeg;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === ''
          ? true
          : item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            (item.categories && item.categories.some((c) => c.toLowerCase().includes(q)));

      return matchesCategory && matchesDietary && matchesSearch;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Cart item counts dictionary for fast lookup
  const cartItemCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cart.forEach((c) => {
      map[c.item.id] = (map[c.item.id] || 0) + c.quantity;
    });
    return map;
  }, [cart]);

  // Cart Handlers supporting variant selection
  const handleAddToCart = (item: MenuItem, variant?: ItemVariant) => {
    setCart((prev) => {
      const targetVariantId = variant ? variant.variantId : 'base';
      const idx = prev.findIndex(
        (ci) => ci.item.id === item.id && (ci.selectedVariant?.variantId || 'base') === targetVariantId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { item, quantity: 1, selectedVariant: variant }];
    });
    showToast(`Added ${item.name}${variant ? ` (${variant.name})` : ''} to cart!`);
  };

  const handleRemoveFromCart = (itemId: string, variantId?: string) => {
    setCart((prev) => {
      const targetVariantId = variantId || 'base';
      const idx = prev.findIndex(
        (ci) => ci.item.id === itemId && (ci.selectedVariant?.variantId || 'base') === targetVariantId
      );
      if (idx === -1) return prev;
      if (prev[idx].quantity > 1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
        return next;
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number, variantId?: string) => {
    setCart((prev) => {
      const targetVariantId = variantId || 'base';
      const idx = prev.findIndex(
        (ci) => ci.item.id === itemId && (ci.selectedVariant?.variantId || 'base') === targetVariantId
      );
      if (idx === -1) return prev;
      const newQty = prev[idx].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== idx);
      }
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  };

  const handleRemoveEntireItem = (itemId: string, variantId?: string) => {
    setCart((prev) => {
      const targetVariantId = variantId || 'base';
      return prev.filter(
        (ci) => !(ci.item.id === itemId && (ci.selectedVariant?.variantId || 'base') === targetVariantId)
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Place Order Handler with selected variant and Firebase persistence
  const handlePlaceOrder = async (customerData: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: 'Cash on Delivery' | 'UPI / Online';
    cookingNotes: string;
  }) => {
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);
    const subtotal = cart.reduce((s, ci) => {
      const itemPrice = ci.selectedVariant ? ci.selectedVariant.price : ci.item.price;
      return s + itemPrice * ci.quantity;
    }, 0);

    let deliveryFee = subtotal > 0 ? 30 : 0;
    let discountAmount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.code === 'FREEDEL') {
        deliveryFee = 0;
      } else if (appliedCoupon.discountType === 'flat') {
        discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
      } else if (appliedCoupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discountAmount);

    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const randSuffix = String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0');
    const orderId = `BK-4-${dateStr}-${randSuffix}`;

    const formattedPhone = customerData.phone.startsWith('+91')
      ? customerData.phone
      : '+91' + customerData.phone.replace(/\D/g, '');

    const newOrder: Order = {
      orderId,
      customerId: currentUser?.phone ? 'cust_' + currentUser.phone.replace(/\D/g, '') : 'g0ootjZLt4hD760ApzKBk7mKELw1',
      customerName: customerData.name || 'Apu De',
      customerPhone: formattedPhone,
      deliveryAddress: customerData.address,
      landmark: 'Bara flat',
      pincode: '831009',
      items: cart.map((ci) => ({
        itemId: ci.item.id,
        name: ci.selectedVariant ? `${ci.item.name} (${ci.selectedVariant.name})` : ci.item.name,
        quantity: ci.quantity,
        price: ci.selectedVariant ? ci.selectedVariant.price : ci.item.price,
        isVeg: ci.item.isVeg,
        isEgg: ci.item.isEgg,
        specialInstructions: ci.cookingInstruction || '',
        isReturnable: false,
        selectedVariant: ci.selectedVariant
      })),
      subtotal,
      deliveryCharge: deliveryFee,
      discount: discountAmount,
      discountAmount,
      couponCode: appliedCoupon?.code || '',
      totalAmount,
      orderStatus: 'ORDER_PLACED',
      paymentMethod: customerData.paymentMethod === 'Cash on Delivery' ? 'CASH_ON_DELIVERY' : 'ONLINE',
      paymentStatus: 'PENDING',
      cookingInstructions: customerData.cookingNotes,
      specialInstructions: customerData.cookingNotes,
      deliveryType: 'Home Delivery',
      termsAccepted: true,
      termsAcceptedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      restaurantId: 'res_1790092996170'
    };

    try {
      await saveOrder(newOrder);
      updateUserProfileInFirestore(formattedPhone, {
        name: customerData.name,
        savedAddress: customerData.address,
        termsAccepted: true,
        termsAcceptedAt: Date.now()
      });
      // Collect individual terms acceptance record in Firestore
      recordTermsAcceptanceInFirestore({
        phone: formattedPhone,
        name: customerData.name,
        role: 'customer',
        source: 'checkout',
        termsTitle: 'Customer Terms & Conditions & FSSAI Standards'
      });
      setActiveOrder(newOrder);
      setOrderHistory((prev) => [newOrder, ...prev.filter((o) => o.orderId !== newOrder.orderId)]);
      setCart([]);
      setAppliedCoupon(null);
      showToast(`🎉 Order Placed Successfully! (ID: ${orderId})`);

      setTimeout(() => {
        const trackerEl = document.getElementById('activeOrderSection');
        if (trackerEl) trackerEl.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      alert(`Could not complete order: ${err?.message || 'Network error'}`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleAddNewItem = (item: MenuItem) => {
    setMenuItems((prev) => [item, ...prev]);
  };

  const handleLogout = () => {
    localStorage.setItem('bhumi_logged_out', 'true');
    localStorage.removeItem('bhumi_user');
    localStorage.removeItem('bhumi_cust_name');
    localStorage.removeItem('bhumi_cust_phone');
    localStorage.removeItem('bhumi_cust_addr');
    localStorage.removeItem('bhumi_role');
    localStorage.removeItem('bhumi_active_order');
    localStorage.removeItem('bhumi_orders');
    setCurrentUser(null);
    setActiveOrder(null);
    setOrderHistory([]);
    setActivePortalView('customer');
    showToast('Customer logged out. Live orders hidden.');
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-[#FAF8F5] text-stone-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          onOpenAccount={() => {
            setAccountModalTab('profile');
            setIsAccountModalOpen(true);
          }}
          fssaiNo={restaurantDetails?.fassaiLicenseNo || '12345678901233'}
          onOpenTerms={() => setIsTermsModalOpen(true)}
          activePortalView={activePortalView}
          onSelectPortalView={(role) => setActivePortalView(role)}
        />

        {/* 4 Tabs for Customer, Kitchen, Rider, Admin - ONLY Terms & Conditions */}
        <div className="bg-white rounded-2xl p-2 border border-stone-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActivePortalView('customer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePortalView === 'customer'
                  ? 'polish-green text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Customer</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activePortalView === 'customer' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                Terms
              </span>
            </button>

            <button
              onClick={() => setActivePortalView('kitchen')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePortalView === 'kitchen'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Kitchen</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activePortalView === 'kitchen' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                Terms
              </span>
            </button>

            <button
              onClick={() => setActivePortalView('rider')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePortalView === 'rider'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Rider</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activePortalView === 'rider' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                Terms
              </span>
            </button>

            <button
              onClick={() => setActivePortalView('admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePortalView === 'admin'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                activePortalView === 'admin' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                Terms
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-800" />
              <span>All Terms Modal</span>
            </button>

          </div>
        </div>

        {/* TAB 1: KITCHEN TERMS & CONDITIONS ONLY */}
        {activePortalView === 'kitchen' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <ChefHat className="w-6 h-6 text-amber-800" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900">Kitchen Terms & Conditions</h2>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                      Food Prep & Hygiene SLA
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Official kitchen staff hygiene, single-use cold-pressed oil, and culinary safety conditions.
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-amber-800">1.</span> Personal Hygiene & Mandatory Gear
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Kitchen staff must wear clean hairnets, fresh aprons, and sanitized gloves during all food prep. Nails must remain trimmed; hands sanitized prior to touching food items.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-amber-800">2.</span> 100% Pure Cold-Pressed Oil Standard
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cook exclusively with pure cold-pressed kachi ghani mustard oil and desi cow ghee. Oil used for frying is single-use and must never be reheated or reused.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-amber-800">3.</span> Fresh Cooking SLA (15–20 min)
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Dishes are prepared fresh upon order receipt. Standard preparation SLA is 15–20 minutes to prevent delivery partner waiting and ensure peak food warmth.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-amber-800">4.</span> Stainless Steel Cookware & Temperature SLA
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Cookware is food-grade stainless steel sanitized daily. Hot curries and rotis must be packed at temperatures exceeding 65°C to preserve quality.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 md:col-span-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-amber-800">5.</span> FSSAI Compliance & Daily Facility Audits
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Daily sanitization of prep tables, cutting stations, and exhaust systems following FSSAI License No: {restaurantDetails?.fassaiLicenseNo || '12345678901233'} standards.
                </p>
              </div>
            </div>

            {/* Official Kitchen Addresses */}
            <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wide">All Official Kitchen Premises:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-stone-600">
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <strong className="text-stone-900 block text-[11px]">1. Main Central Kitchen:</strong>
                  <span>Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur 831001</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <strong className="text-stone-900 block text-[11px]">2. Sidhgora Hub:</strong>
                  <span>326 Bara Flat, Sidhgora, Jamshedpur 831009</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
                  <strong className="text-stone-900 block text-[11px]">3. New Cooch Behar Branch:</strong>
                  <span>Main Station Rd, New Cooch Behar, West Bengal 736101</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: RIDER TERMS & CONDITIONS ONLY */}
        {activePortalView === 'rider' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  <Bike className="w-6 h-6 text-blue-800" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900">Rider Terms & Conditions</h2>
                    <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-300">
                      Delivery Partner Agreement
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Safe transit, insulated thermal delivery containers, and cash collection rules.
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-blue-800">1.</span> Safe Transit & Rider Gear
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Delivery partners must operate a registered vehicle with valid insurance, wear an ISI-certified helmet, and strictly obey traffic laws.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-blue-800">2.</span> Insulated Thermal Delivery Bag
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Meals must be kept upright and secured inside insulated thermal bags until doorstep arrival to prevent spills and keep food piping hot.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-blue-800">3.</span> Contactless Doorstep Handover
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Verify customer identity and phone number before handing over containers. Maintain a polite and professional demeanor at all times.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-blue-800">4.</span> Cash on Delivery (COD) Remittance
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  100% of collected Cash on Delivery funds must be accounted for and deposited with the dispatch desk at shift completion.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 md:col-span-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-blue-800">5.</span> Tamper-Evident Security Seal Integrity
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Never open, pierce, or alter the sealed food packaging. If a seal is compromised during transit, contact the kitchen dispatch immediately.
                </p>
              </div>
            </div>

            {/* Official Kitchen Addresses */}
            <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wide">Fleet Dispatch Locations:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-stone-600">
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <strong className="text-stone-900 block text-[11px]">Northern Town Hub:</strong>
                  <span>Ground N Town, North Park, Main Rd, Jamshedpur 831001</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <strong className="text-stone-900 block text-[11px]">Sidhgora Express Hub:</strong>
                  <span>326 Bara Flat, Sidhgora, Jamshedpur 831009</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200">
                  <strong className="text-stone-900 block text-[11px]">New Cooch Behar Hub:</strong>
                  <span>Main Station Rd, New Cooch Behar, West Bengal 736101</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: ADMIN TERMS & CONDITIONS ONLY */}
        {activePortalView === 'admin' && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-purple-800" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-stone-900">Admin Terms & Conditions</h2>
                    <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-300">
                      Store Governance & Oversight
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    FSSAI regulatory adherence, customer data confidentiality, and service quality governance.
                  </p>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-purple-800">1.</span> FSSAI & Regulatory Governance
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Maintain valid FSSAI Central/State registration (License: {restaurantDetails?.fassaiLicenseNo || '12345678901233'}) and publish license details on digital menus and billing receipts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-purple-800">2.</span> Menu Transparency & Allergen Accuracy
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Provide honest disclosure of pure cold-pressed mustard oil, dairy, and veg/non-veg tags across all dishes. Transparent pricing with zero hidden surcharges.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-purple-800">3.</span> Customer Data Protection & Privacy
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Protect customer phone numbers, addresses, and transaction histories with strict confidentiality. Customer information must never be sold or shared.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-purple-800">4.</span> Customer Grievance SLA (24 Hours)
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Promptly investigate and resolve any customer feedback, taste disputes, or packaging inquiries within 24 hours to ensure 4.9+ star service quality.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 md:col-span-2">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <span className="text-purple-800">5.</span> Multi-Facility Hygiene Audits
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Conduct weekly hygiene and sanitation inspections across all 3 cloud kitchen hubs to guarantee consistent food safety and taste integrity.
                </p>
              </div>
            </div>

            {/* Official Kitchen Addresses */}
            <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wide">Governance Facilities:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-stone-600">
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                  <strong className="text-stone-900 block text-[11px]">Headquarters & Prep Station:</strong>
                  <span>Ground N Town, North Park, Main Rd, Jamshedpur 831001</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                  <strong className="text-stone-900 block text-[11px]">Fleet Operations Hub:</strong>
                  <span>326 Bara Flat, Sidhgora, Jamshedpur 831009</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                  <strong className="text-stone-900 block text-[11px]">Regional North Bengal Hub:</strong>
                  <span>Main Station Rd, New Cooch Behar, West Bengal 736101</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: CUSTOMER TERMS & FEAST MENU */}
        {activePortalView === 'customer' && (
          <>

            {/* Category Selector, Category Terms & Conditions, and All Kitchen Addresses */}
            <CategoryBar
              categories={allCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              dietaryFilter={dietaryFilter}
              onDietaryFilterChange={setDietaryFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              restaurantDetails={restaurantDetails}
              onOpenTerms={() => setIsTermsModalOpen(true)}
            />

            {/* Main Grid: Food Menu + Cart Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Food Items List */}
              <section className="lg:col-span-2 space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-800" />
                    <span>Food Menu</span>
                    <span className="text-xs text-stone-500 font-semibold bg-stone-100 px-2.5 py-0.5 rounded-full">
                      {filteredMenuItems.length} dishes
                    </span>
                  </h2>

                  {dietaryFilter !== 'all' && (
                    <button
                      onClick={() => setDietaryFilter('all')}
                      className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                <MenuGrid
                  items={filteredMenuItems}
                  cartItemCounts={cartItemCounts}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                  onViewItemDetails={(item) => setSelectedItemForModal(item)}
                  isLoading={isLoadingMenu}
                />
              </section>

              {/* Cart & Checkout Sidebar */}
              <div ref={cartSectionRef}>
                <CartSidebar
                  items={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveEntireItem}
                  onClearCart={handleClearCart}
                  appliedCoupon={appliedCoupon}
                  onApplyCoupon={setAppliedCoupon}
                  onPlaceOrder={handlePlaceOrder}
                  isSubmitting={isSubmittingOrder}
                  currentUser={currentUser}
                  onOpenLogin={() => setIsAuthModalOpen(true)}
                  onOpenTerms={() => setIsTermsModalOpen(true)}
                />
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-6 border-t border-stone-200 text-center space-y-3 text-xs text-stone-500">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-stone-200 bg-white p-1 shadow-2xs">
              <img
                src="/bhumi_logo.jpg"
                alt="Bhumi Cloud Kitchen Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-extrabold text-stone-900 text-sm">Bhumi Cloud Kitchen</p>
              <a
                href="https://www.bhumicloudkitchen.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <span>www.bhumicloudkitchen.com</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-semibold text-stone-700">
            <span>Authentic Homestyle Feast</span>
            <span>·</span>
            <span className="italic text-[#78350f]">Rooted in Nature</span>
            <span>·</span>
            <span>{restaurantDetails?.address || 'Jamshedpur & New Cooch Behar'}</span>
            <span>·</span>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
              title="Click to view official FSSAI License & Compliance"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>FSSAI Lic: {restaurantDetails?.fassaiLicenseNo || '12345678901233'}</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="hover:text-emerald-800 hover:underline cursor-pointer text-stone-600 font-medium"
            >
              Terms & Conditions
            </button>
          </div>
          <p className="text-[11px] text-stone-400">
            Freshly prepared with pure mustard oil, aromatic spices, and love. Helpline: {restaurantDetails?.phone || '+919006759560'} • © 2026 www.bhumicloudkitchen.com
          </p>
        </footer>
      </div>

      {/* Floating Customer Support Chat Opener */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-3.5 py-2.5 rounded-full shadow-lg border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          aria-label="Open Support Chat"
        >
          <span>💬 Support Chat</span>
        </button>
      )}

      {/* Customer Support Chat Widget Connected to Firebase */}
      <SupportChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeOrder={currentUser?.isLoggedIn ? activeOrder : null}
        userPhone={currentUser?.phone || '9006759560'}
      />

      {/* Food Item Details Modal with Variant Dropdown */}
      <ItemModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        quantityInCart={selectedItemForModal ? cartItemCounts[selectedItemForModal.id] || 0 : 0}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
      />

      {/* Direct Phone Login Modal (DEMO OTP NOT REQUIRED) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          const targetRole = user.role || 'customer';
          setActivePortalView(targetRole);

          if (targetRole === 'customer') {
            setAccountModalTab('orders');
            setIsAccountModalOpen(true);
            showToast(`Welcome, ${user.name || user.phone}! Here are your order details.`);
          } else if (targetRole === 'kitchen') {
            showToast(`Welcome Chef! Opened Kitchen Display System (KDS).`);
          } else if (targetRole === 'rider') {
            showToast(`Welcome Rider! Opened Delivery Partner Dispatch Page.`);
          } else if (targetRole === 'admin') {
            showToast(`Welcome Admin! Opened Full Operations Management Page.`);
          }
        }}
        onLogout={handleLogout}
        onOpenTerms={() => {
          setIsTermsModalOpen(true);
        }}
        onViewOrders={() => {
          setAccountModalTab('orders');
          setIsAccountModalOpen(true);
        }}
      />

      {/* View Account & Orders Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        initialTab={accountModalTab}
        onUpdateUser={(updated) => {
          setCurrentUser(updated);
          if (updated.role) setActivePortalView(updated.role);
          showToast('Account details saved and synchronized with Firebase!');
        }}
        onLogout={handleLogout}
        orders={orderHistory}
        onSelectOrder={(ord) => setActiveOrder(ord)}
        restaurantDetails={restaurantDetails}
        onOpenTerms={() => {
          setIsAccountModalOpen(false);
          setIsTermsModalOpen(true);
        }}
      />

      {/* Terms & Conditions Modal with Customer, Kitchen, Rider, Admin Tabs */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        settings={restaurantSettings}
        restaurantDetails={restaurantDetails}
        initialTab={activePortalView}
      />

      {/* Kitchen Operations Modal (Secondary access) */}
      <KitchenAdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        activeOrder={activeOrder}
        orders={orderHistory}
        onAddNewItem={handleAddNewItem}
      />
    </div>
  );
}
