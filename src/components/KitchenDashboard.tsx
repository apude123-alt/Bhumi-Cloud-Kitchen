import React, { useState } from 'react';
import { Order, MenuItem, OrderStatus, UserProfile } from '../types';
import {
  updateOrderStatus,
  toggleMenuItemAvailabilityInFirestore,
  acceptOrderReturn,
  completeOrderReturn
} from '../firebase';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Phone,
  Flame,
  AlertCircle,
  PackageCheck,
  Utensils,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  X,
  RotateCcw
} from 'lucide-react';

interface KitchenDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  currentUser: UserProfile | null;
  onNavigateToCustomerMenu: () => void;
  onRefreshOrders?: () => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  orders,
  menuItems,
  currentUser,
  onNavigateToCustomerMenu
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'preparing' | 'ready' | 'returns'>('all');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filtered orders
  const kitchenOrders = orders.filter((o) => {
    if (statusFilter === 'new') return o.orderStatus === 'ORDER_PLACED';
    if (statusFilter === 'preparing') return o.orderStatus === 'PREPARING';
    if (statusFilter === 'ready') return o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'DELIVERED';
    if (statusFilter === 'returns') {
      return (
        o.orderStatus === 'RETURN_REQUESTED' ||
        o.orderStatus === 'RETURN_ACCEPTED' ||
        o.orderStatus === 'OUT_FOR_PICKUP' ||
        o.orderStatus === 'RETURNED'
      );
    }
    return true;
  });

  const newOrdersCount = orders.filter((o) => o.orderStatus === 'ORDER_PLACED').length;
  const preparingOrdersCount = orders.filter((o) => o.orderStatus === 'PREPARING').length;
  const readyOrdersCount = orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'DELIVERED').length;
  const returnsCount = orders.filter(
    (o) =>
      o.orderStatus === 'RETURN_REQUESTED' ||
      o.orderStatus === 'RETURN_ACCEPTED' ||
      o.orderStatus === 'OUT_FOR_PICKUP' ||
      o.orderStatus === 'RETURNED'
  ).length;

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleAcceptReturn = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      await acceptOrderReturn(orderId);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCompleteReturn = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    try {
      await completeOrderReturn(orderId);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleToggleItemStock = async (itemId: string, currentStatus: boolean) => {
    await toggleMenuItemAvailabilityInFirestore(itemId, !currentStatus);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Kitchen Banner */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl polish-green flex items-center justify-center text-amber-300 shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Kitchen Operations Page</h2>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
                Live Kitchen Display (KDS)
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Simmering orders in real time • Connected to Firebase Firestore (bhumi-f3ee0)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'polish-green text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Live Cooking Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'polish-green text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            Dish Availability ({menuItems.length})
          </button>
          <button
            onClick={onNavigateToCustomerMenu}
            className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
            title="Switch to Customer Feast Menu"
          >
            Customer Menu →
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Order Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setStatusFilter(statusFilter === 'new' ? 'all' : 'new')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                statusFilter === 'new'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400'
                  : 'bg-white border-amber-200 hover:bg-amber-50/50 text-stone-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wide">1. New Orders</span>
                <Flame className={`w-4 h-4 ${statusFilter === 'new' ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <p className="text-2xl font-black">{newOrdersCount}</p>
              <span className="text-[10px] opacity-80">Pending confirmation</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'preparing' ? 'all' : 'preparing')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                statusFilter === 'preparing'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500'
                  : 'bg-white border-emerald-200 hover:bg-emerald-50/50 text-stone-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wide">2. Simmering</span>
                <Clock className={`w-4 h-4 ${statusFilter === 'preparing' ? 'text-white' : 'text-emerald-700'}`} />
              </div>
              <p className="text-2xl font-black">{preparingOrdersCount}</p>
              <span className="text-[10px] opacity-80">Cooking on stovetop</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'ready' ? 'all' : 'ready')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                statusFilter === 'ready'
                  ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-500'
                  : 'bg-white border-blue-200 hover:bg-blue-50/50 text-stone-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wide">3. Dispatched</span>
                <PackageCheck className={`w-4 h-4 ${statusFilter === 'ready' ? 'text-white' : 'text-blue-700'}`} />
              </div>
              <p className="text-2xl font-black">{readyOrdersCount}</p>
              <span className="text-[10px] opacity-80">Rider / Delivered</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === 'returns' ? 'all' : 'returns')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                statusFilter === 'returns'
                  ? 'bg-purple-700 text-white border-purple-800 shadow-md ring-2 ring-purple-500'
                  : 'bg-white border-purple-200 hover:bg-purple-50/50 text-stone-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-extrabold uppercase tracking-wide">4. Return Sequence</span>
                <RotateCcw className={`w-4 h-4 ${statusFilter === 'returns' ? 'text-white' : 'text-purple-700'}`} />
              </div>
              <p className="text-2xl font-black">{returnsCount}</p>
              <span className="text-[10px] opacity-80">Returns & refunds</span>
            </button>
          </div>

          {/* Kitchen Orders Grid */}
          {kitchenOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-12 text-center space-y-2">
              <ChefHat className="w-10 h-10 mx-auto text-stone-300" />
              <h3 className="font-bold text-stone-700 text-sm">No orders matching this kitchen filter</h3>
              <p className="text-xs text-stone-400">
                New incoming orders and returns will appear here immediately via Firebase Firestore.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kitchenOrders.map((ord) => {
                const isNew = ord.orderStatus === 'ORDER_PLACED';
                const isPrep = ord.orderStatus === 'PREPARING';
                const isDispatched = ord.orderStatus === 'OUT_FOR_DELIVERY';
                const isDelivered = ord.orderStatus === 'DELIVERED';
                const isReturnReq = ord.orderStatus === 'RETURN_REQUESTED';
                const isReturnAcc = ord.orderStatus === 'RETURN_ACCEPTED';
                const isOutPickup = ord.orderStatus === 'OUT_FOR_PICKUP';
                const isReturned = ord.orderStatus === 'RETURNED';

                return (
                  <div
                    key={ord.orderId}
                    className={`bg-white rounded-3xl p-4 border transition flex flex-col justify-between shadow-2xs ${
                      isReturned
                        ? 'border-purple-300 ring-2 ring-purple-100 bg-purple-50/20'
                        : isReturnReq || isReturnAcc || isOutPickup
                        ? 'border-purple-300 ring-2 ring-purple-100 bg-purple-50/30'
                        : isNew
                        ? 'border-amber-300 ring-2 ring-amber-100'
                        : isPrep
                        ? 'border-emerald-300 ring-2 ring-emerald-50'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Ticket Header */}
                      <div className="flex justify-between items-start pb-2.5 border-b border-stone-100">
                        <div>
                          <span className="font-mono font-black text-sm text-stone-900 block">
                            #{ord.orderId}
                          </span>
                          <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-stone-400" />
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border shadow-2xs ${
                            isReturned
                              ? 'bg-purple-600 text-white border-purple-700'
                              : isOutPickup
                              ? 'bg-blue-600 text-white border-blue-700'
                              : isReturnAcc
                              ? 'bg-indigo-600 text-white border-indigo-700'
                              : isReturnReq
                              ? 'bg-amber-500 text-white border-amber-600'
                              : isNew
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isPrep
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isDispatched
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Return Reason Box if applicable */}
                      {ord.returnReason && (
                        <div className="p-2.5 bg-purple-100/70 border border-purple-200 rounded-xl text-xs space-y-0.5">
                          <span className="font-bold text-purple-900 text-[10px] uppercase block">
                            Customer Return Reason:
                          </span>
                          <p className="text-purple-800 text-[11px] italic">"{ord.returnReason}"</p>
                        </div>
                      )}

                      {/* Customer Info */}
                      <div className="flex justify-between items-center text-xs bg-stone-50 p-2.5 rounded-xl">
                        <div>
                          <p className="font-bold text-stone-800">{ord.customerName}</p>
                          <p className="text-[10px] text-stone-500 font-mono">{ord.customerPhone}</p>
                        </div>
                        <a
                          href={`tel:${ord.customerPhone}`}
                          className="p-1.5 bg-white border border-stone-200 hover:border-emerald-600 rounded-lg text-emerald-800 shadow-2xs transition"
                          title="Call Customer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Items to Cook / Returned Items */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Dishes ({ord.items.length}):
                        </span>
                        <div className="space-y-1">
                          {ord.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-start bg-amber-50/50 border border-amber-100 p-2 rounded-xl text-xs"
                            >
                              <div className="font-semibold text-stone-900 flex-1">
                                <span className="font-black text-amber-900 mr-1.5 text-sm">
                                  {it.quantity}x
                                </span>
                                <span>{it.name}</span>
                                {it.selectedVariant && (
                                  <span className="block text-[10px] text-emerald-800 font-bold">
                                    Variant: {it.selectedVariant.name}
                                  </span>
                                )}
                              </div>
                              <span className="font-bold text-stone-700 text-xs">
                                ₹{it.price * it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cooking Instructions */}
                      {ord.cookingInstructions && (
                        <div className="p-2.5 bg-red-50/80 border border-red-200 rounded-xl text-xs">
                          <span className="font-bold text-red-900 block text-[10px] uppercase">
                            ⚠️ Special Customer Request:
                          </span>
                          <p className="text-red-800 font-medium text-[11px] mt-0.5">
                            "{ord.cookingInstructions}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Triggers */}
                    <div className="pt-3 border-t border-stone-100 mt-3 space-y-1.5">
                      {isReturnReq && (
                        <button
                          onClick={() => handleAcceptReturn(ord.orderId)}
                          disabled={updatingOrderId === ord.orderId}
                          className="w-full bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>ACCEPT RETURN REQUEST</span>
                        </button>
                      )}

                      {isReturnAcc && (
                        <div className="text-center text-xs font-bold text-indigo-900 bg-indigo-50 p-2 rounded-xl border border-indigo-200">
                          <span>Return Accepted • Waiting for Rider Pickup</span>
                        </div>
                      )}

                      {isOutPickup && (
                        <button
                          onClick={() => handleCompleteReturn(ord.orderId)}
                          disabled={updatingOrderId === ord.orderId}
                          className="w-full bg-purple-700 hover:bg-purple-800 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-amber-300" />
                          <span>CONFIRM RETURN RECEIVED AT KITCHEN</span>
                        </button>
                      )}

                      {isReturned && (
                        <div className="text-center text-xs font-bold text-purple-900 bg-purple-100 p-2 rounded-xl border border-purple-200">
                          <span>✅ Package Returned & Refund Completed</span>
                        </div>
                      )}

                      {isNew && (
                        <button
                          onClick={() => handleUpdateStatus(ord.orderId, 'PREPARING')}
                          disabled={updatingOrderId === ord.orderId}
                          className="w-full polish-green hover:bg-[#23482e] active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Flame className="w-4 h-4 text-amber-300" />
                          <span>START COOKING DISHES</span>
                        </button>
                      )}

                      {isPrep && (
                        <button
                          onClick={() => handleUpdateStatus(ord.orderId, 'OUT_FOR_DELIVERY')}
                          disabled={updatingOrderId === ord.orderId}
                          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>READY FOR PICKUP (DISPATCH)</span>
                        </button>
                      )}

                      {(isDispatched || isDelivered) && !isReturnReq && !isReturnAcc && !isOutPickup && !isReturned && (
                        <div className="text-center text-[11px] text-stone-500 font-medium py-1">
                          {isDelivered ? '✅ Order successfully delivered' : '🛵 Out with delivery rider'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-extrabold text-sm text-stone-900">Live Kitchen Dish Inventory</h3>
              <p className="text-xs text-stone-500">Toggle items on/off if ingredients run out</p>
            </div>
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-xl">
              {menuItems.filter((i) => i.available !== false && i.isAvailable !== false).length} Available / {menuItems.length} Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {menuItems.map((item) => {
              const isAvailable = item.available !== false && item.isAvailable !== false;
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    isAvailable ? 'bg-white border-stone-200' : 'bg-red-50/60 border-red-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                    <div>
                      <p className="font-bold text-xs text-stone-900 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">₹{item.price}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleItemStock(item.id, isAvailable)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                      isAvailable
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        : 'bg-red-100 hover:bg-red-200 text-red-800'
                    }`}
                  >
                    {isAvailable ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>{isAvailable ? 'In Stock' : 'Sold Out'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
