import React, { useState, useEffect } from 'react';
import { UserProfile, Order, UserRole } from '../types';
import {
  RestaurantDetails,
  updateUserProfileInFirestore,
  deleteUserAccountFromFirestore,
  updateUserRoleInFirestore
} from '../firebase';
import {
  X,
  User,
  Phone,
  MapPin,
  ShieldCheck,
  PackageCheck,
  FileText,
  LogOut,
  Save,
  CheckCircle2,
  Trash2,
  UtensilsCrossed,
  Bike,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  restaurantDetails: RestaurantDetails | null;
  onOpenTerms: () => void;
  initialTab?: 'profile' | 'orders' | 'kitchen';
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  orders,
  onSelectOrder,
  restaurantDetails,
  onOpenTerms,
  initialTab = 'profile'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'kitchen'>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      if (currentUser) {
        setName(currentUser.name || 'Apu De');
        setAddress(currentUser.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India');
        setLandmark(currentUser.landmark || 'Bara flat');
        setPincode(currentUser.pincode || '831009');
      }
    }
  }, [currentUser, isOpen, initialTab]);

  if (!isOpen || !currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedProfile: UserProfile = {
      ...currentUser,
      name: name.trim(),
      savedAddress: address.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim()
    };

    try {
      await updateUserProfileInFirestore(currentUser.phone, updatedProfile);
      onUpdateUser(updatedProfile);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.warn('Failed saving user profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    const updated: UserProfile = { ...currentUser, role: newRole };
    onUpdateUser(updated);
    localStorage.setItem('bhumi_user', JSON.stringify(updated));
    localStorage.setItem('bhumi_role', newRole);
    await updateUserRoleInFirestore(currentUser.phone, newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('bhumi_user');
    localStorage.removeItem('bhumi_cust_name');
    localStorage.removeItem('bhumi_cust_phone');
    localStorage.removeItem('bhumi_cust_addr');
    localStorage.removeItem('bhumi_role');
    localStorage.removeItem('bhumi_active_order');
    localStorage.removeItem('bhumi_orders');
    localStorage.setItem('bhumi_logged_out', 'true');
    onLogout();
    onClose();
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to permanently delete your account and all associated customer data from Firebase Firestore? This action cannot be reversed.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      if (currentUser?.phone) {
        await deleteUserAccountFromFirestore(currentUser.phone);
      }
      localStorage.removeItem('bhumi_user');
      localStorage.removeItem('bhumi_cust_name');
      localStorage.removeItem('bhumi_cust_phone');
      localStorage.removeItem('bhumi_cust_addr');
      localStorage.removeItem('bhumi_role');
      localStorage.removeItem('bhumi_active_order');
      localStorage.removeItem('bhumi_orders');
      localStorage.setItem('bhumi_logged_out', 'true');
      onLogout();
      alert('Your kitchen account has been permanently removed from Firebase Firestore.');
      onClose();
    } catch (err: any) {
      alert(`Could not delete account: ${err?.message || 'Database error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const fssaiNo = restaurantDetails?.fassaiLicenseNo || '12345678901233';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="polish-green text-white p-5 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-black text-amber-300 border border-white/20">
              {name ? name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">{name || 'Apu De'}</h3>
                <span className="bg-amber-400/90 text-stone-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full capitalize">
                  {currentUser.role || 'customer'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-mono mt-0.5">{currentUser.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Account Details
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>My Orders</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {orders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1 cursor-pointer ${
              activeTab === 'kitchen'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>FSSAI & Kitchen</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-stone-700">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {saveSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Customer name and address saved to Firebase!</span>
                </div>
              )}

              {/* Role Selection */}
              <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900 text-xs">Switch Application Role</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Firestore Synchronized</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {(['customer', 'kitchen', 'rider', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSwitchRole(r)}
                      className={`py-2 px-1.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        (currentUser.role || 'customer') === r
                          ? 'border-emerald-700 bg-white ring-1 ring-emerald-700 text-emerald-950 font-bold shadow-2xs'
                          : 'border-stone-200 bg-white/70 hover:bg-white text-stone-600 font-medium'
                      }`}
                    >
                      {r === 'customer' && <User className="w-3.5 h-3.5 text-emerald-700" />}
                      {r === 'kitchen' && <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />}
                      {r === 'rider' && <Bike className="w-3.5 h-3.5 text-blue-700" />}
                      {r === 'admin' && <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />}
                      <span className="capitalize text-[11px]">{r}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Card */}
              <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-stone-900 text-sm">Customer Profile</span>
                    <span className="text-[10px] text-emerald-700 block font-medium">
                      ✓ Synchronized with Firebase Firestore
                    </span>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-emerald-800 hover:underline font-bold text-xs cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-stone-500 hover:underline text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Full Customer Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Delivery Address
                      </label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Bara flat"
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="831009"
                          className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="polish-green text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Syncing to Firebase...' : 'Save & Sync'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Customer Name</span>
                      <p className="font-bold text-stone-800 text-sm">{name}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Verified Phone Number</span>
                      <p className="font-mono font-bold text-stone-800">{currentUser.phone}</p>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Delivery Address</span>
                      <p className="font-medium text-stone-700 leading-relaxed">{address}</p>
                      {landmark && (
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Landmark: {landmark} · Pincode: {pincode}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FSSAI Quick Strip */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-800" />
                  <div>
                    <span className="font-bold text-stone-900 block">FSSAI Certified Cloud Kitchen</span>
                    <span className="text-[11px] text-stone-600 font-mono">Lic. #{fssaiNo}</span>
                  </div>
                </div>
                <button
                  onClick={onOpenTerms}
                  className="text-emerald-800 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <span>Terms</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Account Quick Actions */}
              <div className="pt-2 flex justify-between items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-stone-600 hover:text-emerald-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  <span>Terms & Conditions</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-stone-700 hover:text-stone-900 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-stone-100 border border-stone-200 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-stone-600" />
                    <span>Log Out</span>
                  </button>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteAccount}
                    className="text-red-700 hover:text-red-800 font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-red-200 transition cursor-pointer disabled:opacity-50"
                    title="Permanently delete account from Firebase"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-800">
                  Your Orders Synchronized with Firebase ({orders.length})
                </span>
                <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full font-bold">
                  Live Real-time
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
                  <PackageCheck className="w-8 h-8 mx-auto opacity-50 text-stone-400" />
                  <p className="font-semibold text-xs text-stone-600">No previous orders found</p>
                  <p className="text-[11px]">
                    Orders placed with your phone number will synchronize here automatically in real time from Firestore!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {orders.map((ord) => (
                    <div
                      key={ord.orderId}
                      onClick={() => {
                        onSelectOrder(ord);
                        onClose();
                        const tracker = document.getElementById('activeOrderSection');
                        if (tracker) tracker.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 transition cursor-pointer space-y-2 shadow-2xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-xs text-emerald-900 block">
                            #{ord.orderId}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            ord.orderStatus === 'RETURNED'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : ord.orderStatus === 'OUT_FOR_PICKUP'
                              ? 'bg-blue-100 text-blue-900 border-blue-300'
                              : ord.orderStatus === 'RETURN_ACCEPTED'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : ord.orderStatus === 'RETURN_REQUESTED'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : ord.orderStatus === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : ord.orderStatus === 'OUT_FOR_DELIVERY'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : ord.orderStatus === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-amber-100 text-amber-900 border-amber-200'
                          }`}
                        >
                          {ord.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-[11px] text-stone-700 bg-stone-50 p-2 rounded-xl">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between py-0.5">
                            <span>
                              {it.quantity}x {it.name}
                            </span>
                            <span className="font-semibold text-stone-900">
                              ₹{it.price * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-100 font-semibold">
                        <span className="text-stone-500">{ord.paymentMethod}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            ₹{ord.totalAmount}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Track Status →
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'kitchen' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50/80 border border-emerald-300 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-800" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">FSSAI License Details</h4>
                    <p className="text-[11px] text-emerald-800">
                      Food Safety & Standards Authority of India (Connected to Firebase)
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">License Number:</span>
                    <span className="font-bold text-emerald-900 text-sm bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {fssaiNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Kitchen Name:</span>
                    <span className="font-bold font-sans text-stone-800">{restaurantDetails?.name || 'Bhumi Cloud Kitchen Jamshedpur'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">UPI ID:</span>
                    <span className="font-bold font-mono text-stone-800">{restaurantDetails?.upiId || 'apu.de123@oksbi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 font-sans">Hours:</span>
                    <span className="font-bold font-sans text-stone-800">
                      {restaurantDetails?.openTime || '05:00'} - {restaurantDetails?.closeTime || '23:50'} (Open)
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <p className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kitchen Premises & Dispatch Hub:</span>
                </p>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {restaurantDetails?.address || 'Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur, Jharkhand 831001, India'}
                </p>
              </div>

              <button
                onClick={onOpenTerms}
                className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold text-xs text-emerald-900 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Read Full Terms & Food Hygiene Policies</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-stone-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Firebase Firestore Online</span>
          </div>
          <button
            onClick={onClose}
            className="polish-green text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
