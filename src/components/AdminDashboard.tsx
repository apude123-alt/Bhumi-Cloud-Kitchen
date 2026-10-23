import React, { useState, useEffect } from 'react';
import { Order, MenuItem, OrderStatus, UserProfile } from '../types';
import {
  RestaurantDetails,
  RestaurantSettings,
  updateOrderStatus,
  saveMenuItemToFirestore,
  deleteMenuItemFromFirestore,
  updateRestaurantDetailsInFirestore,
  updateRestaurantSettingsInFirestore,
  subscribeToTermsAcceptances,
  seedMenuItemsToFirestore,
  sendSupportMessageToFirestore,
  acceptOrderReturn,
  completeOrderReturn
} from '../firebase';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';
import {
  ShieldAlert,
  TrendingUp,
  Package,
  Utensils,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  MapPin,
  RefreshCw,
  Send,
  MessageSquare,
  FileText,
  Users,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  restaurantDetails: RestaurantDetails | null;
  restaurantSettings: RestaurantSettings | null;
  currentUser: UserProfile | null;
  onNavigateToCustomerMenu: () => void;
  onAddNewItem: (item: MenuItem) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  menuItems,
  restaurantDetails,
  restaurantSettings,
  currentUser,
  onNavigateToCustomerMenu,
  onAddNewItem
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'settings' | 'support' | 'terms'>('overview');

  // Individual Terms Acceptances collected in Firestore
  const [termsAcceptances, setTermsAcceptances] = useState<any[]>([]);
  const [termsRoleFilter, setTermsRoleFilter] = useState<'all' | 'customer' | 'kitchen' | 'rider' | 'admin'>('all');
  const [termsSearchQuery, setTermsSearchQuery] = useState('');
  const [editingRoleTerms, setEditingRoleTerms] = useState<'customer' | 'kitchen' | 'rider' | 'admin'>('customer');

  const [customerTermsText, setCustomerTermsText] = useState(
    restaurantSettings?.customerTerms ||
      '1. Meals prepared strictly according to FSSAI hygiene standards using cold-pressed mustard oil.\n2. Fresh delivery within Jamshedpur & New Cooch Behar.\n3. Cancellation is permitted within 5 minutes before cooking begins.\n4. COD and online UPI payment accepted.'
  );
  const [kitchenTermsText, setKitchenTermsText] = useState(
    restaurantSettings?.kitchenTerms ||
      '1. Mandatory hairnet, fresh apron, and hand-washing every 30 minutes.\n2. Cook strictly with cold-pressed pure mustard oil; zero burnt oil reuse.\n3. Prepare & dispatch orders within 20 minutes SLA.\n4. Maintain hot food holding temperatures above 65°C.'
  );
  const [riderTermsText, setRiderTermsText] = useState(
    restaurantSettings?.riderTerms ||
      '1. Always wear an ISI-certified helmet and observe road safety.\n2. Keep meals upright inside insulated thermal bag.\n3. Verify customer name & order ID before handover.\n4. Reconcile 100% of COD cash collected at end of shift.'
  );
  const [adminTermsText, setAdminTermsText] = useState(
    restaurantSettings?.adminTerms ||
      '1. Supervise FSSAI license validity and kitchen hygiene audits.\n2. Ensure accurate menu pricing, availability, and allergen tags.\n3. Protect customer personal information and contact numbers.\n4. Resolve customer support tickets and dispatch issues promptly.'
  );

  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [termsSaveSuccess, setTermsSaveSuccess] = useState(false);

  useEffect(() => {
    if (restaurantSettings) {
      if (restaurantSettings.customerTerms) setCustomerTermsText(restaurantSettings.customerTerms);
      if (restaurantSettings.kitchenTerms) setKitchenTermsText(restaurantSettings.kitchenTerms);
      if (restaurantSettings.riderTerms) setRiderTermsText(restaurantSettings.riderTerms);
      if (restaurantSettings.adminTerms) setAdminTermsText(restaurantSettings.adminTerms);
    }
  }, [restaurantSettings]);

  useEffect(() => {
    const unsub = subscribeToTermsAcceptances((data) => {
      setTermsAcceptances(data);
    });
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleSaveTermsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTerms(true);
    try {
      await updateRestaurantSettingsInFirestore({
        customerTerms: customerTermsText.trim(),
        kitchenTerms: kitchenTermsText.trim(),
        riderTerms: riderTermsText.trim(),
        adminTerms: adminTermsText.trim()
      });
      setTermsSaveSuccess(true);
      setTimeout(() => setTermsSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingTerms(false);
    }
  };

  // Menu item add state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('All Time');
  const [newItemPrice, setNewItemPrice] = useState('180');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDiet, setNewItemDiet] = useState<'veg' | 'non-veg'>('veg');
  const [newItemImage, setNewItemImage] = useState(
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600'
  );
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Settings form state
  const [fssaiNo, setFssaiNo] = useState(restaurantDetails?.fassaiLicenseNo || '12345678901233');
  const [kitchenName, setKitchenName] = useState(restaurantDetails?.name || 'Bhumi Cloud Kitchen');
  const [kitchenPhone, setKitchenPhone] = useState(restaurantDetails?.phone || '+919006759560');
  const [kitchenAddress, setKitchenAddress] = useState(
    restaurantDetails?.address ||
      'Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur, Jharkhand 831001, India'
  );
  const [upiId, setUpiId] = useState(restaurantDetails?.upiId || 'apu.de123@oksbi');
  const [openTime, setOpenTime] = useState(restaurantDetails?.openTime || '05:00');
  const [closeTime, setCloseTime] = useState(restaurantDetails?.closeTime || '23:50');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Support reply state
  const [supportReplyPhone, setSupportReplyPhone] = useState('9006759560');
  const [supportReplyText, setSupportReplyText] = useState('');
  const [supportSentSuccess, setSupportSentSuccess] = useState(false);

  // Analytics
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'active' | 'delivered' | 'returns'>('all');
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalDelivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const activeOrdersCount = orders.filter(
    (o) => o.orderStatus === 'ORDER_PLACED' || o.orderStatus === 'PREPARING' || o.orderStatus === 'OUT_FOR_DELIVERY'
  ).length;
  const returnsCount = orders.filter(
    (o) =>
      o.orderStatus === 'RETURN_REQUESTED' ||
      o.orderStatus === 'RETURN_ACCEPTED' ||
      o.orderStatus === 'OUT_FOR_PICKUP' ||
      o.orderStatus === 'RETURNED'
  ).length;

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    setIsAddingItem(true);
    const created: MenuItem = {
      id: 'item_' + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      categories: [newItemCategory, 'All Time'],
      description: newItemDesc.trim() || 'Authentic homestyle dish cooked fresh with pure mustard oil.',
      price: Number(newItemPrice) || 150,
      imageUrl: newItemImage.trim(),
      rating: 4.9,
      ratingCount: 1,
      dietary: newItemDiet,
      isVeg: newItemDiet === 'veg',
      isAvailable: true,
      available: true,
      portion: 'Serves 1-2',
      prepTimeMinutes: 20,
      spiceLevel: 'Medium'
    };

    try {
      await saveMenuItemToFirestore(created);
      onAddNewItem(created);
      setAddSuccess(true);
      setNewItemName('');
      setNewItemDesc('');
      setTimeout(() => setAddSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Delete this dish from the menu?')) {
      await deleteMenuItemFromFirestore(itemId);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateRestaurantDetailsInFirestore({
        fassaiLicenseNo: fssaiNo.trim(),
        name: kitchenName.trim(),
        phone: kitchenPhone.trim(),
        address: kitchenAddress.trim(),
        upiId: upiId.trim(),
        openTime: openTime.trim(),
        closeTime: closeTime.trim()
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportReplyText.trim()) return;

    await sendSupportMessageToFirestore({
      text: supportReplyText.trim(),
      sender: 'kitchen',
      userPhone: supportReplyPhone.trim()
    });
    setSupportReplyText('');
    setSupportSentSuccess(true);
    setTimeout(() => setSupportSentSuccess(false), 2500);
  };

  const handleSeedMenu = async () => {
    if (window.confirm('Restore/Seed default homestyle dishes to Firebase?')) {
      const count = await seedMenuItemsToFirestore(DEFAULT_MENU_ITEMS);
      alert(`🎉 Successfully synchronized ${count} dishes to Firestore menuItems!`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Admin Banner */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-700 flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Kitchen Administrator Portal</h2>
              <span className="bg-purple-100 text-purple-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-300">
                Full Control
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              FSSAI Lic. #{restaurantDetails?.fassaiLicenseNo || '12345678901233'} • Connected to Firebase (bhumi-f3ee0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedMenu}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            title="Seed/Sync dishes to Firestore"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Dishes</span>
          </button>
          <button
            onClick={onNavigateToCustomerMenu}
            className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Customer Menu →
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-stone-200 bg-white px-4 pt-2 rounded-t-3xl border border-b-0 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Operations & Revenue</span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'menu'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Manage Menu ({menuItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>FSSAI & Kitchen Config</span>
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'support'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Support Desk Console</span>
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'border-purple-600 text-purple-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Terms & Compliance</span>
          {termsAcceptances.length > 0 && (
            <span className="bg-purple-100 text-purple-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {termsAcceptances.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-b-3xl border border-stone-200 p-6 shadow-xs">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-1">
                <span className="text-xs font-bold text-purple-700">Gross Sales</span>
                <p className="text-2xl font-black text-purple-950">₹{totalRevenue}</p>
                <span className="text-[10px] text-stone-500">Across all orders</span>
              </div>

              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-700">Delivered Orders</span>
                <p className="text-2xl font-black text-emerald-950">{totalDelivered}</p>
                <span className="text-[10px] text-stone-500">Completed doorsteps</span>
              </div>

              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-800">Active Queue</span>
                <p className="text-2xl font-black text-amber-950">{activeOrdersCount}</p>
                <span className="text-[10px] text-stone-500">In cooking or transit</span>
              </div>

              <div className="bg-purple-100/80 p-4 rounded-2xl border border-purple-300 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-purple-900">Returns Pipeline</span>
                  <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <p className="text-2xl font-black text-purple-950">{returnsCount}</p>
                <span className="text-[10px] text-purple-700 font-semibold">Requests, Pickups & Returned</span>
              </div>

              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1 col-span-2 md:col-span-1">
                <span className="text-xs font-bold text-stone-600">Total Menu Dishes</span>
                <p className="text-2xl font-black text-stone-900">{menuItems.length}</p>
                <span className="text-[10px] text-stone-500">In live catalog</span>
              </div>
            </div>

            {/* Master Orders Table */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">Live Orders Pipeline ({orders.length})</h3>
                  <p className="text-[11px] text-stone-500">Synchronized in Real Time with Firebase Firestore</p>
                </div>

                {/* Pipeline Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setOrdersFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      ordersFilter === 'all'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrdersFilter('active')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      ordersFilter === 'active'
                        ? 'bg-white text-amber-900 shadow-2xs font-extrabold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Active ({activeOrdersCount})
                  </button>
                  <button
                    onClick={() => setOrdersFilter('delivered')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      ordersFilter === 'delivered'
                        ? 'bg-white text-emerald-900 shadow-2xs font-extrabold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Delivered ({totalDelivered})
                  </button>
                  <button
                    onClick={() => setOrdersFilter('returns')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      ordersFilter === 'returns'
                        ? 'bg-purple-700 text-white shadow-2xs font-extrabold'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Returns ({returnsCount})</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                      <th className="py-2.5 px-3 rounded-l-xl">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Dishes</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 rounded-r-xl">Action / Return Flow</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders
                      .filter((ord) => {
                        if (ordersFilter === 'active') {
                          return (
                            ord.orderStatus === 'ORDER_PLACED' ||
                            ord.orderStatus === 'PREPARING' ||
                            ord.orderStatus === 'OUT_FOR_DELIVERY'
                          );
                        }
                        if (ordersFilter === 'delivered') {
                          return ord.orderStatus === 'DELIVERED';
                        }
                        if (ordersFilter === 'returns') {
                          return (
                            ord.orderStatus === 'RETURN_REQUESTED' ||
                            ord.orderStatus === 'RETURN_ACCEPTED' ||
                            ord.orderStatus === 'OUT_FOR_PICKUP' ||
                            ord.orderStatus === 'RETURNED'
                          );
                        }
                        return true;
                      })
                      .map((ord) => {
                        const isReturnReq = ord.orderStatus === 'RETURN_REQUESTED';
                        const isReturnAcc = ord.orderStatus === 'RETURN_ACCEPTED';
                        const isOutPickup = ord.orderStatus === 'OUT_FOR_PICKUP';
                        const isReturned = ord.orderStatus === 'RETURNED';

                        return (
                          <tr
                            key={ord.orderId}
                            className={`transition ${
                              isReturned
                                ? 'bg-purple-50/40 hover:bg-purple-50/80'
                                : isReturnReq
                                ? 'bg-amber-50/40 hover:bg-amber-50/80'
                                : 'hover:bg-stone-50/60'
                            }`}
                          >
                            <td className="py-3 px-3 font-mono font-bold text-emerald-900">
                              <div>#{ord.orderId}</div>
                              <span className="text-[10px] text-stone-400 font-sans">
                                {new Date(ord.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-stone-800">{ord.customerName}</p>
                              <p className="text-[10px] text-stone-500 font-mono">{ord.customerPhone}</p>
                              {ord.returnPickupRiderName && (
                                <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
                                  Pickup Rider: {ord.returnPickupRiderName}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-3 text-stone-600 max-w-[200px]">
                              <p className="truncate">
                                {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                              </p>
                              {ord.returnReason && (
                                <p className="text-[10px] text-purple-800 font-semibold italic mt-0.5">
                                  Return Reason: {ord.returnReason}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-stone-900">
                              <div>₹{ord.totalAmount}</div>
                              <span className="text-[10px] text-stone-400 font-normal">
                                {ord.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border shadow-2xs inline-block ${
                                  isReturned
                                    ? 'bg-purple-600 text-white border-purple-700'
                                    : isOutPickup
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : isReturnAcc
                                    ? 'bg-indigo-600 text-white border-indigo-700'
                                    : isReturnReq
                                    ? 'bg-amber-500 text-white border-amber-600'
                                    : ord.orderStatus === 'DELIVERED'
                                    ? 'bg-emerald-700 text-white border-emerald-800'
                                    : ord.orderStatus === 'OUT_FOR_DELIVERY'
                                    ? 'bg-blue-600 text-white border-blue-700'
                                    : ord.orderStatus === 'PREPARING'
                                    ? 'bg-amber-600 text-white border-amber-700'
                                    : ord.orderStatus === 'CANCELLED'
                                    ? 'bg-red-600 text-white border-red-700'
                                    : 'bg-stone-600 text-white border-stone-700'
                                }`}
                              >
                                {ord.orderStatus.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3 space-y-1">
                              {/* Full 9-Status Dropdown */}
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => updateOrderStatus(ord.orderId, e.target.value as OrderStatus)}
                                className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-[11px] font-bold text-stone-700 cursor-pointer shadow-2xs"
                              >
                                <option value="ORDER_PLACED">ORDER_PLACED (Order Confirmed)</option>
                                <option value="PREPARING">PREPARING (Cooking)</option>
                                <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY (Out for Delivery)</option>
                                <option value="DELIVERED">DELIVERED (Delivered to Doorstep)</option>
                                <option value="RETURN_REQUESTED">RETURN_REQUESTED (Return Request)</option>
                                <option value="RETURN_ACCEPTED">RETURN_ACCEPTED (Return Accept)</option>
                                <option value="OUT_FOR_PICKUP">OUT_FOR_PICKUP (Out for Pickup)</option>
                                <option value="RETURNED">RETURNED (Package Returned)</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>

                              {/* Quick Action Return Buttons */}
                              {isReturnReq && (
                                <button
                                  type="button"
                                  onClick={() => acceptOrderReturn(ord.orderId)}
                                  className="w-full px-2 py-1 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>1. Accept Return Request</span>
                                </button>
                              )}

                              {isReturnAcc && (
                                <button
                                  type="button"
                                  onClick={() => updateOrderStatus(ord.orderId, 'OUT_FOR_PICKUP')}
                                  className="w-full px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>2. Dispatch for Pickup</span>
                                </button>
                              )}

                              {isOutPickup && (
                                <button
                                  type="button"
                                  onClick={() => completeOrderReturn(ord.orderId)}
                                  className="w-full px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-lg text-[10px] transition cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-amber-300" />
                                  <span>3. Confirm Returned & Refund</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Add Dish Form */}
            <form onSubmit={handleCreateMenuItem} className="bg-stone-50 p-4 rounded-3xl border border-stone-200 space-y-3">
              <h3 className="font-extrabold text-xs text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Add New Food Dish to Menu (Saved to Firebase)</span>
              </h3>

              {addSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dish added and synchronized with Firestore!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Chicken Curry"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  >
                    <option value="All Time">All Time</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Dietary Type</label>
                  <select
                    value={newItemDiet}
                    onChange={(e) => setNewItemDiet(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  >
                    <option value="veg">Pure Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Photo URL</label>
                  <input
                    type="url"
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Authentic homestyle dish simmered with mustard oil..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={isAddingItem}
                className="polish-green text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingItem ? 'Saving to Firestore...' : 'SAVE DISH TO MENU'}</span>
              </button>
            </form>

            {/* Existing Menu Items */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-stone-900 uppercase">Live Menu Catalog ({menuItems.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <div key={item.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="truncate">
                        <p className="font-bold text-stone-900 truncate">{item.name}</p>
                        <p className="text-[10px] text-stone-500 font-bold">₹{item.price} • {item.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-stone-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <ShieldCheck className="w-5 h-5 text-emerald-800" />
              <div>
                <h3 className="font-black text-sm text-stone-900">FSSAI & Restaurant Credentials</h3>
                <p className="text-[11px] text-stone-500">Directly synchronized with Firebase restaurants collection</p>
              </div>
            </div>

            {settingsSaved && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Restaurant credentials updated in Firestore!</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                FSSAI License Number (Food Safety Authority)
              </label>
              <input
                type="text"
                required
                value={fssaiNo}
                onChange={(e) => setFssaiNo(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold text-emerald-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Kitchen Name</label>
              <input
                type="text"
                required
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Helpline Phone</label>
                <input
                  type="text"
                  required
                  value={kitchenPhone}
                  onChange={(e) => setKitchenPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">UPI ID for Online Payments</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Kitchen Dispatch Address</label>
              <textarea
                rows={2}
                required
                value={kitchenAddress}
                onChange={(e) => setKitchenAddress(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Daily Opening Time</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Daily Closing Time</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="polish-green text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSettings ? 'Saving to Firebase...' : 'SAVE & SYNC TO FIREBASE'}</span>
            </button>
          </form>
        )}

        {activeTab === 'support' && (
          <div className="space-y-4 max-w-xl text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
              <MessageSquare className="w-5 h-5 text-amber-700" />
              <div>
                <h3 className="font-black text-sm text-stone-900">Kitchen Support Live Console</h3>
                <p className="text-[11px] text-stone-500">Send direct replies to customer chats via Firebase supportChats</p>
              </div>
            </div>

            {supportSentSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Support reply broadcasted to customer via Firestore!</span>
              </div>
            )}

            <form onSubmit={handleSendSupportReply} className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Customer Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="9006759560"
                  value={supportReplyPhone}
                  onChange={(e) => setSupportReplyPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Kitchen / Admin Response Message</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hello! Your homestyle chicken thali is currently simmering on low flame and will be ready in 10 minutes..."
                  value={supportReplyText}
                  onChange={(e) => setSupportReplyText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="polish-green text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>SEND DIRECT MESSAGE TO CUSTOMER</span>
              </button>
            </form>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6 text-xs animate-in fade-in duration-150">
            {/* Header & Policy statement */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    Role-Specific Terms & Conditions Compliance Console
                  </h3>
                  <p className="text-[11px] text-purple-900 font-medium mt-0.5">
                    Customer portal uses <strong>Customer Ordering Terms</strong>. Kitchen, Rider, and Admin portals each have <strong>separate, dedicated conditions</strong>.
                    Individual acceptances are collected separately with the exact role-specific agreement recorded in Firebase Firestore.
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-300 shrink-0 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-700" />
                <span>Distinct Role Policies</span>
              </span>
            </div>

            {/* Metrics cards */}
            {(() => {
              const custCount = termsAcceptances.filter((t) => t.role === 'customer').length;
              const kitchenCount = termsAcceptances.filter((t) => t.role === 'kitchen').length;
              const riderCount = termsAcceptances.filter((t) => t.role === 'rider').length;
              const adminCount = termsAcceptances.filter((t) => t.role === 'admin').length;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-stone-500">Total Collected</p>
                    <p className="text-xl font-black text-stone-900 mt-1">{termsAcceptances.length}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">Audit records</p>
                  </div>
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-emerald-800">Customer</p>
                    <p className="text-xl font-black text-emerald-950 mt-1">{custCount}</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Ordering Terms</p>
                  </div>
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-amber-800">Kitchen Staff</p>
                    <p className="text-xl font-black text-amber-950 mt-1">{kitchenCount}</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Prep Conditions</p>
                  </div>
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-blue-800">Riders</p>
                    <p className="text-xl font-black text-blue-950 mt-1">{riderCount}</p>
                    <p className="text-[10px] text-blue-700 mt-0.5">Delivery Agreement</p>
                  </div>
                  <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-purple-800">Admin</p>
                    <p className="text-xl font-black text-purple-950 mt-1">{adminCount}</p>
                    <p className="text-[10px] text-purple-700 mt-0.5">Governance Oversight</p>
                  </div>
                </div>
              );
            })()}

            {/* Editable Role-Specific Terms Configuration */}
            <form onSubmit={handleSaveTermsConfig} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-700" />
                    <span>Configure Role-Specific Terms & Conditions (Firebase Firestore)</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Each section requires agreement to its own separate operational conditions.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isSavingTerms}
                  className="polish-green text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingTerms ? 'Saving...' : 'Save & Publish All Terms'}</span>
                </button>
              </div>

              {termsSaveSuccess && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Role conditions successfully updated in Firestore! All portals immediately reflect their updated terms.</span>
                </div>
              )}

              {/* Sub-tabs for selecting which role conditions to edit */}
              <div className="flex border-b border-stone-200 gap-1 pt-1">
                {(['customer', 'kitchen', 'rider', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEditingRoleTerms(r)}
                    className={`pb-2 px-3 text-xs font-bold capitalize transition border-b-2 cursor-pointer ${
                      editingRoleTerms === r
                        ? 'border-purple-700 text-purple-950 bg-white rounded-t-lg'
                        : 'border-transparent text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {r} {r === 'customer' ? 'Terms' : 'Conditions'}
                  </button>
                ))}
              </div>

              {editingRoleTerms === 'customer' && (
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Customer Ordering Terms & Conditions (Shown on Checkout & Customer Login)
                  </label>
                  <textarea
                    rows={4}
                    value={customerTermsText}
                    onChange={(e) => setCustomerTermsText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-sans text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-600 leading-relaxed"
                    placeholder="Enter customer ordering terms & conditions..."
                  />
                </div>
              )}

              {editingRoleTerms === 'kitchen' && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Kitchen Staff Food Prep & Hygiene Conditions (Shown on Kitchen Portal Login)
                  </label>
                  <textarea
                    rows={4}
                    value={kitchenTermsText}
                    onChange={(e) => setKitchenTermsText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-sans text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-600 leading-relaxed"
                    placeholder="Enter kitchen staff food preparation & hygiene conditions..."
                  />
                </div>
              )}

              {editingRoleTerms === 'rider' && (
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 mb-1">
                    Rider Delivery Partner & Cash Remittance Agreement (Shown on Rider Portal Login)
                  </label>
                  <textarea
                    rows={4}
                    value={riderTermsText}
                    onChange={(e) => setRiderTermsText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-sans text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                    placeholder="Enter rider delivery partner and cash remittance agreement..."
                  />
                </div>
              )}

              {editingRoleTerms === 'admin' && (
                <div>
                  <label className="block text-[11px] font-bold text-purple-900 mb-1">
                    Administrator Governance & FSSAI Oversight Conditions (Shown on Admin Portal Login)
                  </label>
                  <textarea
                    rows={4}
                    value={adminTermsText}
                    onChange={(e) => setAdminTermsText(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl font-sans text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-purple-600 leading-relaxed"
                    placeholder="Enter admin store governance & FSSAI oversight conditions..."
                  />
                </div>
              )}
            </form>

            {/* Filter and Search Bar for Collected Records */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                <div>
                  <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-700" />
                    <span>Collected Individual Terms Acceptances (Real-time Firestore)</span>
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Individual records logged whenever any customer, kitchen, rider, or admin accepts terms upon login, checkout, or modal view.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search phone or name..."
                      value={termsSearchQuery}
                      onChange={(e) => setTermsSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* Role filter pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'customer', 'kitchen', 'rider', 'admin'] as const).map((r) => {
                  const count =
                    r === 'all'
                      ? termsAcceptances.length
                      : termsAcceptances.filter((t) => t.role === r).length;
                  return (
                    <button
                      key={r}
                      onClick={() => setTermsRoleFilter(r)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer border ${
                        termsRoleFilter === r
                          ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {r} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Table / List */}
              {(() => {
                const filtered = termsAcceptances.filter((rec) => {
                  const matchesRole = termsRoleFilter === 'all' || rec.role === termsRoleFilter;
                  const query = termsSearchQuery.trim().toLowerCase();
                  const matchesSearch =
                    !query ||
                    (rec.name || '').toLowerCase().includes(query) ||
                    (rec.phone || '').includes(query) ||
                    (rec.cleanPhone || '').includes(query);
                  return matchesRole && matchesSearch;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                      <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                      <p className="font-bold text-stone-700 text-xs">No acceptance records match the criteria.</p>
                      <p className="text-[11px] text-stone-400">
                        {termsAcceptances.length === 0
                          ? 'Users logging in with terms check or placing orders will automatically appear here in real time.'
                          : 'Try selecting another role filter or clearing your search query.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-stone-200 rounded-2xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-stone-100/80 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3.5 py-2.5">User / Phone</th>
                          <th className="px-3 py-2.5">Role</th>
                          <th className="px-3 py-2.5">Source</th>
                          <th className="px-3 py-2.5">Accepted Terms Title</th>
                          <th className="px-3 py-2.5">Date & Time</th>
                          <th className="px-3 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200 bg-white">
                        {filtered.map((item, idx) => {
                          const roleColors: Record<string, string> = {
                            customer: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                            kitchen: 'bg-amber-100 text-amber-900 border-amber-300',
                            rider: 'bg-blue-100 text-blue-900 border-blue-300',
                            admin: 'bg-purple-100 text-purple-900 border-purple-300'
                          };
                          const formattedTime = item.acceptedAt
                            ? new Date(item.acceptedAt).toLocaleString()
                            : item.timestamp || 'Just now';

                          return (
                            <tr key={item.id || idx} className="hover:bg-stone-50/70 transition">
                              <td className="px-3.5 py-2.5">
                                <div className="font-bold text-stone-900">{item.name || 'User'}</div>
                                <div className="font-mono text-[10px] text-stone-500">{item.phone}</div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${
                                    roleColors[item.role] || 'bg-stone-100 text-stone-800 border-stone-200'
                                  }`}
                                >
                                  {item.role || 'customer'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="capitalize font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                                  {item.source || 'login'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-stone-700 max-w-xs truncate">
                                {item.termsTitle || 'Customer Terms & Conditions & FSSAI Standards'}
                              </td>
                              <td className="px-3 py-2.5 text-stone-500 font-mono text-[10px] whitespace-nowrap">
                                {formattedTime}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Compliant</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
