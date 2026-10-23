import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { requestOrderReturn } from '../firebase';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  Home,
  Phone,
  ChevronRight,
  RefreshCw,
  X,
  MapPin,
  RotateCcw,
  AlertCircle,
  PackageCheck,
  FileText,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

interface OrderTrackerProps {
  activeOrder: Order | null;
  orderHistory: Order[];
  onSelectOrder: (order: Order) => void;
  onClose?: () => void;
  onCallKitchen?: () => void;
}

// Normal Delivery Sequence
const DELIVERY_STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'ORDER_PLACED', label: 'Order Confirmed', desc: 'Received at Bhumi Kitchen' },
  { key: 'PREPARING', label: 'Preparing Feast', desc: 'Freshly cooking with authentic spices' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way (within 6km)' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your delicious feast!' }
];

// Return Sequence: Return Request -> Return Accept -> Out for Pickup -> Returned
const RETURN_STATUS_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'RETURN_REQUESTED', label: '1. Return Request', desc: 'Customer return request submitted' },
  { key: 'RETURN_ACCEPTED', label: '2. Return Accept', desc: 'Accepted by kitchen management' },
  { key: 'OUT_FOR_PICKUP', label: '3. Out for Pickup', desc: 'Rider dispatched for doorstep collection' },
  { key: 'RETURNED', label: '4. Returned', desc: 'Item received at kitchen & refund credited' }
];

export const OrderTracker: React.FC<OrderTrackerProps> = ({
  activeOrder,
  orderHistory,
  onSelectOrder,
  onCallKitchen
}) => {
  const [isRequestingReturn, setIsRequestingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('Food Quality / Taste Concern');
  const [customReturnNote, setCustomReturnNote] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState<string | null>(null);

  if (!activeOrder && orderHistory.length === 0) {
    return null;
  }

  const currentOrder = activeOrder || orderHistory[0];
  if (!currentOrder) return null;

  // Determine if this order is in the Return Sequence
  const isReturnSequence =
    currentOrder.orderStatus === 'RETURN_REQUESTED' ||
    currentOrder.orderStatus === 'RETURN_ACCEPTED' ||
    currentOrder.orderStatus === 'OUT_FOR_PICKUP' ||
    currentOrder.orderStatus === 'RETURNED';

  const isCancelled = currentOrder.orderStatus === 'CANCELLED';

  // Calculate timeline index
  let activeStepIdx = 0;
  if (isReturnSequence) {
    const rIdx = RETURN_STATUS_STEPS.findIndex((s) => s.key === currentOrder.orderStatus);
    activeStepIdx = rIdx >= 0 ? rIdx : 3;
  } else {
    const dIdx = DELIVERY_STATUS_STEPS.findIndex((s) => s.key === currentOrder.orderStatus);
    activeStepIdx = dIdx >= 0 ? dIdx : (currentOrder.orderStatus === 'DELIVERED' ? 3 : 0);
  }

  const handleInitiateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReturn(true);
    const finalReason = customReturnNote.trim()
      ? `${returnReason} - Note: ${customReturnNote.trim()}`
      : returnReason;

    try {
      await requestOrderReturn(currentOrder.orderId, finalReason);
      setReturnSuccessMsg('Return request successfully submitted! Kitchen will review and accept shortly.');
      setIsRequestingReturn(false);
      setCustomReturnNote('');
    } catch (err) {
      console.error('Failed to submit return request:', err);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div
      id="activeOrderSection"
      className={`p-5 md:p-6 rounded-3xl shadow-sm border space-y-5 transition ${
        isReturnSequence
          ? 'bg-gradient-to-b from-purple-50/70 via-white to-stone-50/80 border-purple-200'
          : isCancelled
          ? 'bg-red-50/60 border-red-200'
          : 'bg-white border-emerald-300/80'
      }`}
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                currentOrder.orderStatus === 'RETURNED'
                  ? 'bg-purple-600'
                  : isReturnSequence
                  ? 'bg-amber-500 animate-pulse'
                  : isCancelled
                  ? 'bg-red-500'
                  : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <h3 className="text-base font-extrabold text-stone-900 tracking-tight">
              {isReturnSequence ? (
                <>
                  🔄 Live Return Sequence Status:{' '}
                  <span className="font-mono text-purple-700">{currentOrder.orderId}</span>
                </>
              ) : isCancelled ? (
                <>
                  🚫 Order Cancelled:{' '}
                  <span className="font-mono text-red-700">{currentOrder.orderId}</span>
                </>
              ) : (
                <>
                  📦 Live Order Status:{' '}
                  <span className="font-mono text-emerald-700">{currentOrder.orderId}</span>
                </>
              )}
            </h3>

            {/* Current Status Badge */}
            <span
              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-2xs ${
                currentOrder.orderStatus === 'RETURNED'
                  ? 'bg-purple-600 text-white border-purple-700'
                  : currentOrder.orderStatus === 'OUT_FOR_PICKUP'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : currentOrder.orderStatus === 'RETURN_ACCEPTED'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : currentOrder.orderStatus === 'RETURN_REQUESTED'
                  ? 'bg-amber-500 text-white border-amber-600'
                  : currentOrder.orderStatus === 'DELIVERED'
                  ? 'bg-emerald-700 text-white border-emerald-800'
                  : currentOrder.orderStatus === 'OUT_FOR_DELIVERY'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : isCancelled
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-amber-500 text-white border-amber-600'
              }`}
            >
              {currentOrder.orderStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-xs text-stone-500 mt-1">
            Placed on {new Date(currentOrder.createdAt).toLocaleDateString()} at{' '}
            {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
            · {currentOrder.paymentMethod} · Total: ₹{currentOrder.totalAmount}
          </p>
        </div>

        {/* Contact Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isReturnSequence && currentOrder.returnPickupRiderPhone ? (
            <a
              href={`tel:${currentOrder.returnPickupRiderPhone}`}
              className="text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Bike className="w-3.5 h-3.5 text-purple-700" />
              <span>
                Return Pickup Rider ({currentOrder.returnPickupRiderName || 'Assigned'}):{' '}
                {currentOrder.returnPickupRiderPhone}
              </span>
            </a>
          ) : currentOrder.deliveryPartnerPhone ? (
            <a
              href={`tel:${currentOrder.deliveryPartnerPhone}`}
              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                Rider ({currentOrder.deliveryPartnerName || 'Assigned'}): {currentOrder.deliveryPartnerPhone}
              </span>
            </a>
          ) : (
            <button
              onClick={() => onCallKitchen?.()}
              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>Kitchen Helpline: 03582-25588</span>
            </button>
          )}

          {/* Customer Request Return Button when order is Delivered and not yet in return */}
          {currentOrder.orderStatus === 'DELIVERED' && !isReturnSequence && (
            <button
              onClick={() => setIsRequestingReturn(!isRequestingReturn)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRequestingReturn ? 'Close Return Form' : 'Request Return / Refund'}</span>
            </button>
          )}
        </div>
      </div>

      {returnSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{returnSuccessMsg}</span>
        </div>
      )}

      {/* Return Request Modal / Inline Form */}
      {isRequestingReturn && (
        <form
          onSubmit={handleInitiateReturn}
          className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-xs space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-800" />
              <h4 className="font-extrabold text-amber-950 text-sm">
                Initiate Return & Refund for Order #{currentOrder.orderId}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsRequestingReturn(false)}
              className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-stone-600 text-[11px]">
            Please specify why you wish to return your order. Once submitted, our kitchen manager will
            accept the request and dispatch a rider for doorstep pickup.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                Reason for Return <span className="text-red-500">*</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-amber-600"
              >
                <option value="Food Quality / Taste Concern">Food Quality / Taste Concern</option>
                <option value="Incorrect Item or Dish Delivered">Incorrect Item or Dish Delivered</option>
                <option value="Packaging Damaged / Spilled in Transit">
                  Packaging Damaged / Spilled in Transit
                </option>
                <option value="Food Arrived Cold">Food Arrived Cold</option>
                <option value="Missing Dish from Feast">Missing Dish from Feast</option>
                <option value="Other Legitimate Reason">Other Legitimate Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-800 mb-1">
                Additional Comments / Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Received Egg Curry instead of Paneer Butter Masala"
                value={customReturnNote}
                onChange={(e) => setCustomReturnNote(e.target.value)}
                className="w-full p-2 bg-white border border-stone-300 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsRequestingReturn(false)}
              className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingReturn}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Visual Timeline: Either Return Sequence (4 Steps) or Delivery Sequence (4 Steps) */}
      {!isCancelled && (
        <div className="relative py-2">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              {isReturnSequence ? 'Return & Refund Progression:' : 'Kitchen To Doorstep Progression:'}
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                isReturnSequence
                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              Step {activeStepIdx + 1} of 4
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {(isReturnSequence ? RETURN_STATUS_STEPS : DELIVERY_STATUS_STEPS).map((step, idx) => {
              const isCompleted = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-2xl border transition ${
                    isCurrent
                      ? isReturnSequence
                        ? 'bg-purple-50 border-purple-600 shadow-sm ring-2 ring-purple-100'
                        : 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-2 ring-emerald-100'
                      : isCompleted
                      ? isReturnSequence
                        ? 'bg-purple-50/40 border-purple-200'
                        : 'bg-stone-50 border-stone-200'
                      : 'bg-white border-dashed border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? isReturnSequence
                            ? 'bg-purple-700 text-white'
                            : 'bg-emerald-700 text-white'
                          : isCompleted
                          ? isReturnSequence
                            ? 'bg-purple-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {isReturnSequence ? (
                        idx === 0 ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : idx === 1 ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : idx === 2 ? (
                          <Bike className="w-3.5 h-3.5" />
                        ) : (
                          <PackageCheck className="w-3.5 h-3.5" />
                        )
                      ) : idx === 0 ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : idx === 1 ? (
                        <ChefHat className="w-3.5 h-3.5" />
                      ) : idx === 2 ? (
                        <Bike className="w-3.5 h-3.5" />
                      ) : (
                        <Home className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold truncate ${
                        isCurrent
                          ? isReturnSequence
                            ? 'text-purple-950 font-black'
                            : 'text-emerald-950 font-black'
                          : isCompleted
                          ? 'text-stone-800'
                          : 'text-stone-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Return Information Banner when in return sequence */}
      {isReturnSequence && (
        <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-extrabold text-purple-950">
              <RotateCcw className="w-4 h-4 text-purple-700" />
              <span>Return Status: {currentOrder.orderStatus.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-[11px] font-bold text-purple-900 bg-white px-2.5 py-0.5 rounded-full border border-purple-200">
              Refund Amount: ₹{currentOrder.totalAmount}
            </span>
          </div>

          {currentOrder.orderStatus === 'RETURNED' && (
            <div className="bg-white p-3 rounded-xl border border-purple-200 text-stone-700 space-y-1">
              <p className="font-extrabold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Return Package Received & Verified by Bhumi Kitchen!</span>
              </p>
              <p className="text-[11px] text-stone-600">
                The food package has been physically returned and inspected. Refund of{' '}
                <strong className="text-stone-900">₹{currentOrder.totalAmount}</strong> has been{' '}
                <span className="text-emerald-700 font-bold uppercase">
                  {currentOrder.refundStatus || 'COMPLETED'}
                </span>{' '}
                to your original payment account.
              </p>
              {currentOrder.returnedAt && (
                <p className="text-[10px] text-stone-400 font-mono">
                  Completed on: {new Date(currentOrder.returnedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {currentOrder.orderStatus === 'OUT_FOR_PICKUP' && (
            <div className="bg-white p-3 rounded-xl border border-blue-200 text-stone-700 space-y-1">
              <p className="font-extrabold text-blue-900 flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-blue-600" />
                <span>Rider Out for Return Pickup</span>
              </p>
              <p className="text-[11px] text-stone-600">
                Delivery partner{' '}
                <strong className="text-stone-900">
                  {currentOrder.returnPickupRiderName || 'Rider Partner'}
                </strong>{' '}
                is heading to your doorstep address to collect the sealed package.
              </p>
              {currentOrder.returnPickupRiderPhone && (
                <a
                  href={`tel:${currentOrder.returnPickupRiderPhone}`}
                  className="inline-flex items-center gap-1 font-bold text-blue-800 text-[11px] hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Rider: {currentOrder.returnPickupRiderPhone}</span>
                </a>
              )}
            </div>
          )}

          {currentOrder.orderStatus === 'RETURN_ACCEPTED' && (
            <div className="bg-white p-3 rounded-xl border border-indigo-200 text-stone-700 space-y-1">
              <p className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>Return Request Accepted by Kitchen Manager</span>
              </p>
              <p className="text-[11px] text-stone-600">
                Your return request has been authorized. A rider is currently being assigned to pick up the
                dish package from your address.
              </p>
            </div>
          )}

          {currentOrder.orderStatus === 'RETURN_REQUESTED' && (
            <div className="bg-white p-3 rounded-xl border border-amber-200 text-stone-700 space-y-1">
              <p className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Return Request Under Review</span>
              </p>
              <p className="text-[11px] text-stone-600">
                We have received your return request and our kitchen supervisor is verifying the details.
                Approval normally takes 2-5 minutes.
              </p>
            </div>
          )}

          {currentOrder.returnReason && (
            <div className="pt-1 text-[11px] text-stone-600">
              <span className="font-bold text-stone-800">Return Reason on Record:</span>{' '}
              <span className="italic">{currentOrder.returnReason}</span>
            </div>
          )}
        </div>
      )}

      {/* Cancelled Notice */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Order Cancelled</span>
          </div>
          <p className="text-stone-600 leading-relaxed text-[11px]">
            This order was cancelled within the cancellation window. If payment was made via UPI/Online,
            your refund has been initiated to your source account.
          </p>
        </div>
      )}

      {/* Order Summary & Customer Address Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/90 p-4 rounded-2xl text-xs text-stone-700 border border-stone-200/60">
        <div className="space-y-1.5">
          <p className="font-bold text-stone-900">Delivery Address:</p>
          <p className="text-stone-800 font-semibold">
            {currentOrder.customerName} ({currentOrder.customerPhone})
          </p>
          <p className="text-stone-600 leading-relaxed">{currentOrder.deliveryAddress}</p>
          {currentOrder.landmark && (
            <p className="text-stone-500 text-[11px]">Landmark: {currentOrder.landmark}</p>
          )}
          {currentOrder.cookingInstructions && (
            <p className="text-amber-800 text-[11px] font-medium pt-1">
              Note to Chef: "{currentOrder.cookingInstructions}"
            </p>
          )}
          {currentOrder.deliveryPartnerName && !isReturnSequence && (
            <div className="pt-2 border-t border-stone-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span>Assigned Delivery Partner: {currentOrder.deliveryPartnerName}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 md:border-l md:border-stone-200 md:pl-4">
          <p className="font-bold text-stone-900">Ordered Items ({currentOrder.items.length}):</p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {currentOrder.items.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-[11px] bg-white p-1.5 rounded-lg border border-stone-200/50"
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span className="font-bold text-stone-700">{item.quantity}x</span>
                  <span className="text-stone-800 font-medium truncate">{item.name}</span>
                </div>
                <span className="font-bold text-stone-900 shrink-0">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-extrabold text-xs text-stone-900 border-t border-stone-200 pt-2 mt-1">
            <span>Total Amount:</span>
            <span className="text-emerald-800 text-sm">₹{currentOrder.totalAmount}</span>
          </div>
        </div>
      </div>

      {/* History Drawer if multiple orders */}
      {orderHistory.length > 1 && (
        <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-stone-600 font-bold">
            All Your Orders in Firebase ({orderHistory.length}):
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {orderHistory.slice(0, 8).map((hist) => {
              const histIsReturn =
                hist.orderStatus === 'RETURNED' ||
                hist.orderStatus === 'RETURN_REQUESTED' ||
                hist.orderStatus === 'RETURN_ACCEPTED' ||
                hist.orderStatus === 'OUT_FOR_PICKUP';

              return (
                <button
                  key={hist.orderId}
                  onClick={() => onSelectOrder(hist)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono border whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    hist.orderId === currentOrder.orderId
                      ? histIsReturn
                        ? 'bg-purple-700 text-white font-bold border-purple-800 shadow-2xs'
                        : 'bg-emerald-700 text-white font-bold border-emerald-800 shadow-2xs'
                      : histIsReturn
                      ? 'bg-purple-50 border-purple-200 text-purple-900 hover:bg-purple-100'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>#{hist.orderId}</span>
                  <span className="font-sans font-bold text-[9px] uppercase opacity-90">
                    ({hist.orderStatus.replace(/_/g, ' ')})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
