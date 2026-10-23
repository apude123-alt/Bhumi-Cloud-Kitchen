import React, { useState } from 'react';
import { Order, OrderStatus, UserProfile } from '../types';
import {
  updateOrderStatus,
  assignRiderToOrder,
  assignRiderToReturnPickup,
  completeOrderReturn
} from '../firebase';
import {
  Bike,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  Navigation,
  Clock,
  Banknote,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  RotateCcw
} from 'lucide-react';

interface RiderDashboardProps {
  orders: Order[];
  currentUser: UserProfile | null;
  onNavigateToCustomerMenu: () => void;
}

export const RiderDashboard: React.FC<RiderDashboardProps> = ({
  orders,
  currentUser,
  onNavigateToCustomerMenu
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'in_transit' | 'completed' | 'returns'>('in_transit');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const riderName = currentUser?.name || 'Rider Partner';
  const riderPhone = currentUser?.phone || '+919006759560';

  // Orders waiting for pickup from kitchen
  const waitingOrders = orders.filter(
    (o) => o.orderStatus === 'PREPARING' || o.orderStatus === 'ORDER_PLACED'
  );

  // Orders out for delivery
  const inTransitOrders = orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY');

  // Orders delivered
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED');

  // Orders in return sequence
  const returnOrders = orders.filter(
    (o) =>
      o.orderStatus === 'RETURN_ACCEPTED' ||
      o.orderStatus === 'OUT_FOR_PICKUP' ||
      o.orderStatus === 'RETURNED'
  );

  const totalCashToCollect = inTransitOrders
    .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const handlePickUpOrder = async (orderId: string) => {
    setIsProcessing(orderId);
    try {
      await assignRiderToOrder(orderId, riderName, riderPhone);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    setIsProcessing(orderId);
    try {
      await updateOrderStatus(orderId, 'DELIVERED');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleStartReturnPickup = async (orderId: string) => {
    setIsProcessing(orderId);
    try {
      await assignRiderToReturnPickup(orderId, riderName, riderPhone);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleCompleteReturnToKitchen = async (orderId: string) => {
    setIsProcessing(orderId);
    try {
      await completeOrderReturn(orderId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(null);
    }
  };

  const displayedOrders =
    activeTab === 'pending'
      ? waitingOrders
      : activeTab === 'in_transit'
      ? inTransitOrders
      : activeTab === 'completed'
      ? deliveredOrders
      : returnOrders;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Rider Banner */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-xs">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">Rider Delivery Partner Page</h2>
              <span className="bg-blue-100 text-blue-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-300">
                Active Dispatch & Returns
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Assigned rider: <strong className="text-stone-800">{riderName}</strong> ({riderPhone}) • Synchronized with Firebase
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToCustomerMenu}
          className="px-3.5 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Customer Menu →
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500">
            <span>In-Transit</span>
            <Bike className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-950">{inTransitOrders.length}</p>
          <span className="text-[10px] text-stone-400">Out for delivery</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500">
            <span>Cash (COD)</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900">₹{totalCashToCollect}</p>
          <span className="text-[10px] text-stone-400">To collect today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-stone-500">
            <span>Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-stone-900">{deliveredOrders.length}</p>
          <span className="text-[10px] text-stone-400">Doorstep drop-offs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-xs font-bold text-purple-700">
            <span>Return Pickups</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950">{returnOrders.length}</p>
          <span className="text-[10px] text-purple-600">Doorstep return sequence</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 bg-white px-4 pt-2 rounded-t-3xl border border-b-0 gap-2 text-xs font-bold flex-wrap">
        <button
          onClick={() => setActiveTab('in_transit')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'in_transit'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Active In-Transit ({inTransitOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Available at Kitchen ({waitingOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'border-purple-600 text-purple-800 font-extrabold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
          <span>Return Pickups ({returnOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 px-3 border-b-2 transition cursor-pointer ${
            activeTab === 'completed'
              ? 'border-blue-600 text-blue-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Delivered History ({deliveredOrders.length})</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-b-3xl border border-stone-200 p-5 shadow-xs">
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12 text-stone-400 space-y-2">
            <Package className="w-8 h-8 mx-auto opacity-50" />
            <p className="font-bold text-xs text-stone-600">No orders in this delivery section</p>
            <p className="text-[11px]">When orders transition in the kitchen, they will show up here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedOrders.map((ord) => {
              const isCOD = ord.paymentMethod === 'CASH_ON_DELIVERY';
              const isReturnAcc = ord.orderStatus === 'RETURN_ACCEPTED';
              const isOutPickup = ord.orderStatus === 'OUT_FOR_PICKUP';
              const isReturned = ord.orderStatus === 'RETURNED';

              return (
                <div
                  key={ord.orderId}
                  className={`border rounded-3xl p-4 space-y-3 shadow-2xs transition ${
                    isReturned
                      ? 'bg-purple-50/50 border-purple-200'
                      : isOutPickup || isReturnAcc
                      ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-200'
                      : 'bg-stone-50/70 border-stone-200 hover:border-blue-400'
                  }`}
                >
                  {/* Order Top Bar */}
                  <div className="flex justify-between items-start pb-2 border-b border-stone-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-stone-900 block">
                          #{ord.orderId}
                        </span>
                        {(isReturnAcc || isOutPickup || isReturned) && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.2 rounded-md">
                            Return Sequence
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        isReturned
                          ? 'bg-purple-600 text-white border-purple-700'
                          : isOutPickup
                          ? 'bg-blue-600 text-white border-blue-700'
                          : isReturnAcc
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : ord.orderStatus === 'OUT_FOR_DELIVERY'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : ord.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {ord.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Return Reason Banner if applicable */}
                  {ord.returnReason && (
                    <div className="p-2.5 bg-purple-100/70 border border-purple-200 rounded-2xl text-xs space-y-0.5">
                      <span className="font-bold text-purple-900 text-[11px] block">
                        Customer Return Reason:
                      </span>
                      <p className="text-purple-800 text-[11px] italic">"{ord.returnReason}"</p>
                    </div>
                  )}

                  {/* Customer & Address Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-2xl border border-stone-200">
                      <div>
                        <span className="font-bold text-stone-900 block">{ord.customerName}</span>
                        <span className="font-mono text-stone-600 text-[11px]">{ord.customerPhone}</span>
                      </div>
                      <a
                        href={`tel:${ord.customerPhone}`}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-1 border border-emerald-200 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>

                    {/* Destination Address */}
                    <div className="bg-white p-3 rounded-2xl border border-stone-200 space-y-1.5">
                      <div className="flex items-start gap-1.5 text-stone-700">
                        <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold leading-relaxed text-stone-800">
                            {ord.deliveryAddress}
                          </p>
                          {ord.landmark && (
                            <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                              Landmark: {ord.landmark} • Pincode: {ord.pincode}
                            </p>
                          )}
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          ord.deliveryAddress + ' ' + (ord.pincode || '')
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:underline font-bold mt-1"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Open in Google Maps Navigation</span>
                      </a>
                    </div>

                    {/* Payment Badge */}
                    <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-stone-200">
                      <span className="text-stone-500 font-medium">Payment Mode:</span>
                      {isCOD ? (
                        <span className="font-extrabold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                          💵 COD (₹{ord.totalAmount})
                        </span>
                      ) : (
                        <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          ✅ PAID ONLINE (₹{ord.totalAmount})
                        </span>
                      )}
                    </div>

                    {/* Parcel Contents */}
                    <div className="text-[11px] text-stone-600 pt-1">
                      <span className="font-bold text-stone-700">Dishes: </span>
                      {ord.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                    </div>
                  </div>

                  {/* Rider Status Action */}
                  <div className="pt-2 border-t border-stone-200">
                    {/* Return Sequence Actions */}
                    {isReturnAcc ? (
                      <button
                        onClick={() => handleStartReturnPickup(ord.orderId)}
                        disabled={isProcessing === ord.orderId}
                        className="w-full bg-blue-700 hover:bg-blue-800 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Bike className="w-4 h-4 text-amber-300" />
                        <span>ACCEPT & START RETURN PICKUP</span>
                      </button>
                    ) : isOutPickup ? (
                      <button
                        onClick={() => handleCompleteReturnToKitchen(ord.orderId)}
                        disabled={isProcessing === ord.orderId}
                        className="w-full bg-purple-700 hover:bg-purple-800 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>CONFIRM PACKAGE RETURNED TO KITCHEN</span>
                      </button>
                    ) : isReturned ? (
                      <div className="text-center text-xs font-bold text-purple-900 py-1 flex items-center justify-center gap-1 bg-purple-100 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-purple-700" />
                        <span>Package Returned to Kitchen • Refund Processed</span>
                      </div>
                    ) : ord.orderStatus === 'OUT_FOR_DELIVERY' ? (
                      <button
                        onClick={() => handleMarkDelivered(ord.orderId)}
                        disabled={isProcessing === ord.orderId}
                        className="w-full polish-green hover:bg-[#23482e] active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4 text-amber-300" />
                        <span>CONFIRM DOORSTEP DELIVERY</span>
                      </button>
                    ) : ord.orderStatus === 'DELIVERED' ? (
                      <div className="text-center text-xs font-bold text-emerald-800 py-1 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Delivered at Doorstep</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePickUpOrder(ord.orderId)}
                        disabled={isProcessing === ord.orderId}
                        className="w-full bg-blue-700 hover:bg-blue-800 active:scale-95 text-white py-2.5 px-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Bike className="w-4 h-4" />
                        <span>PICK UP & START DELIVERY</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
