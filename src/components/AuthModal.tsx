import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  deleteUserAccountFromFirestore,
  updateUserProfileInFirestore,
  updateUserRoleInFirestore,
  recordTermsAcceptanceInFirestore,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  FirebasePhoneConfirmation
} from '../firebase';
import {
  X,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  UtensilsCrossed,
  Bike,
  ShieldAlert,
  Trash2,
  LogOut,
  PackageCheck,
  FileText,
  ChefHat,
  KeyRound,
  Send
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onOpenTerms?: () => void;
  onViewOrders?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  onOpenTerms,
  onViewOrders
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<FirebasePhoneConfirmation | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize state
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setOtp('');
      setOtpSent(false);
      setConfirmationResult(null);
      if (currentUser?.isLoggedIn) {
        setPhone(currentUser.phone);
        setName(currentUser.name || '');
        setSelectedRole(currentUser.role || 'customer');
        setTermsAccepted(currentUser.termsAccepted ?? true);
      } else {
        setTermsAccepted(false);
        const storedPhone = localStorage.getItem('bhumi_cust_phone') || '9006759560';
        const storedName = localStorage.getItem('bhumi_cust_name') || 'Apu De';
        const storedRole = (localStorage.getItem('bhumi_role') as UserRole) || 'customer';
        if (storedPhone) setPhone(storedPhone);
        if (storedName) setName(storedName);
        if (storedRole) setSelectedRole(storedRole);
      }
    }
  }, [isOpen, currentUser]);

  const handleSendOtp = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }
    setIsSendingOtp(true);
    setErrorMsg(null);
    try {
      const result = await sendFirebasePhoneOtp(cleanPhone, 'recaptcha-auth-container');
      setConfirmationResult(result);
      setOtpSent(true);
      setOtp(''); // Auto-fill explicitly not used: user types OTP manually
    } catch (err: any) {
      console.error('Firebase OTP send error:', err);
      setErrorMsg(err?.message || 'Failed to send Firebase OTP. Please check your number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  if (!isOpen) return null;

  // Phone Login with Firebase OTP verification
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!otpSent || !confirmationResult) {
      setErrorMsg('OTP is required for login. Please click "Send OTP" to receive your code via SMS.');
      return;
    }

    if (otp.trim().length !== 6) {
      setErrorMsg('Please enter the complete 6-digit OTP code received on your phone.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Please select and agree to the Terms & Conditions to log in.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg(null);

    try {
      await verifyFirebasePhoneOtp(confirmationResult, otp);
    } catch (verifyErr: any) {
      setIsLoggingIn(false);
      setErrorMsg(verifyErr?.message || 'Invalid OTP code. Please check and try again.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Please select and agree to the Terms & Conditions to log in.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg(null);

    const fullPhone = `+91${cleanPhone.slice(-10)}`;
    const finalName = name.trim() || (selectedRole === 'kitchen' ? 'Kitchen Chef' : selectedRole === 'rider' ? 'Delivery Partner' : selectedRole === 'admin' ? 'Kitchen Admin' : 'Apu De');

    const userObj: UserProfile = {
      phone: fullPhone,
      name: finalName,
      savedAddress: currentUser?.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
      isLoggedIn: true,
      loggedInAt: Date.now(),
      role: selectedRole,
      termsAccepted: true,
      termsAcceptedAt: Date.now()
    };

    // Reset logged-out flag and persist session
    localStorage.removeItem('bhumi_logged_out');
    localStorage.setItem('bhumi_user', JSON.stringify(userObj));
    localStorage.setItem('bhumi_cust_name', userObj.name || '');
    localStorage.setItem('bhumi_cust_phone', cleanPhone.slice(-10));
    localStorage.setItem('bhumi_role', selectedRole);

    const roleTermsTitles: Record<UserRole, string> = {
      customer: 'Customer Ordering Terms & Conditions and FSSAI Standards',
      kitchen: 'Kitchen Staff Food Safety & Prep Conditions',
      rider: 'Rider Delivery Partner & Cash Remittance Agreement',
      admin: 'Admin Store Governance & FSSAI Oversight Conditions'
    };

    // Sync with Firebase Firestore users collection & termAcceptances
    try {
      await updateUserProfileInFirestore(cleanPhone.slice(-10), {
        name: userObj.name,
        savedAddress: userObj.savedAddress,
        role: selectedRole,
        termsAccepted: true
      });
      await recordTermsAcceptanceInFirestore({
        phone: cleanPhone.slice(-10),
        name: userObj.name,
        role: selectedRole,
        source: 'login',
        termsTitle: roleTermsTitles[selectedRole]
      });
    } catch (err) {
      console.warn('Sync profile & terms to Firestore warning:', err);
    }

    setIsLoggingIn(false);
    onLoginSuccess(userObj);
  };

  const handleDirectLogout = () => {
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
      alert('Your account has been permanently removed from Firebase Firestore.');
      onClose();
    } catch (err: any) {
      alert(`Could not delete account: ${err?.message || 'Database error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    setSelectedRole(newRole);
    if (currentUser && currentUser.phone) {
      const updated = { ...currentUser, role: newRole };
      localStorage.setItem('bhumi_user', JSON.stringify(updated));
      localStorage.setItem('bhumi_role', newRole);
      await updateUserRoleInFirestore(currentUser.phone, newRole);
      onLoginSuccess(updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="polish-green text-white p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-2">
              <Phone className="w-5 h-5 text-amber-300" />
            </div>
            <h3 className="font-extrabold text-base tracking-tight">
              {currentUser?.isLoggedIn ? 'Your Account & Role' : 'Direct Mobile Login'}
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              {currentUser?.isLoggedIn
                ? 'Connected to Firebase Firestore (bhumi-f3ee0)'
                : 'Select Role & Terms to Login Directly'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-stone-700">
          {currentUser?.isLoggedIn ? (
            /* Logged in state view */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full polish-green text-white font-black flex items-center justify-center text-sm shadow-xs">
                      {currentUser.name ? currentUser.name[0].toUpperCase() : 'B'}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{currentUser.name || 'Bhumi Member'}</p>
                      <p className="text-stone-600 font-mono text-xs">{currentUser.phone}</p>
                    </div>
                  </div>
                  <span className="bg-emerald-700 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full shadow-2xs">
                    {currentUser.role || 'customer'}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-900">
                  <span className="font-semibold">Delivery Address:</span> {currentUser.savedAddress}
                </div>
              </div>

              {/* Role Switcher */}
              <div className="space-y-1.5 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-900">
                  Switch Active Portal / Page:
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(['customer', 'kitchen', 'rider', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        (currentUser.role || 'customer') === r
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-extrabold shadow-2xs'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700 font-medium'
                      }`}
                    >
                      {r === 'customer' && <User className="w-4 h-4 text-emerald-700" />}
                      {r === 'kitchen' && <UtensilsCrossed className="w-4 h-4 text-amber-700" />}
                      {r === 'rider' && <Bike className="w-4 h-4 text-blue-700" />}
                      {r === 'admin' && <ShieldAlert className="w-4 h-4 text-purple-700" />}
                      <span className="capitalize text-xs font-bold">{r} Page</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Order Details Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onViewOrders) onViewOrders();
                }}
                className="w-full polish-green hover:bg-[#23482e] text-white py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>View My Orders & Delivery Details</span>
              </button>

              {/* Logout & Delete Account Actions */}
              <div className="pt-3 border-t border-stone-200 flex gap-2">
                <button
                  type="button"
                  onClick={handleDirectLogout}
                  className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-600" />
                  <span>Log Out</span>
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Permanently remove your account and data from Firebase Firestore"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Account'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Direct Login Form (DEMO OTP NOT REQUIRED) */
            <form onSubmit={handleDirectLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g. Apu De"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Mobile Number <span className="text-red-500">*</span></span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800">OTP Required Every Login</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex border border-stone-200 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-emerald-700 bg-stone-50">
                    <span className="inline-flex items-center px-3 text-xs font-bold bg-stone-100 border-r border-stone-200 text-stone-700">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="90067 59560"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ''));
                        setOtpSent(false);
                        setConfirmationResult(null);
                        setErrorMsg(null);
                      }}
                      className="flex-1 px-3 py-2 text-xs bg-transparent font-bold tracking-wide focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="px-3.5 py-2 polish-green hover:bg-[#23482e] active:scale-95 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3 text-amber-300" />
                    <span>{isSendingOtp ? 'Sending...' : otpSent ? 'Resend' : 'Send OTP'}</span>
                  </button>
                </div>
              </div>

              {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
              <div id="recaptcha-auth-container"></div>

              {/* OTP Notification Banner (Firebase SMS - Auto-fill explicitly removed) */}
              {otpSent && confirmationResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs animate-in fade-in duration-150">
                  <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    📩
                  </span>
                  <div>
                    <p className="font-bold text-emerald-950">
                      Firebase OTP SMS sent to +91 {phone.slice(-10)}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Please check your mobile messages and manually enter the 6-digit code below.
                    </p>
                  </div>
                </div>
              )}

              {/* Mandatory 6-Digit OTP Input Field */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Enter 6-Digit OTP <span className="text-red-500">*</span></span>
                  </span>
                  <span className="text-[10px] font-bold text-stone-500">
                    {otpSent ? 'Enter code from SMS' : 'Click "Send OTP" above'}
                  </span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorMsg(null);
                  }}
                  placeholder={otpSent ? 'e.g. 6-digit OTP' : 'Request OTP first to continue'}
                  className="w-full px-3.5 py-2.5 text-stone-900 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest text-sm font-bold placeholder:tracking-normal placeholder:text-xs placeholder:font-normal"
                />
              </div>

              {/* Role Selection Dropdown/Grid */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-stone-800">
                    Select Role & Landing Page:
                  </label>
                  <span className="text-emerald-800 uppercase font-black text-[11px]">{selectedRole}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'customer', label: 'Customer', desc: 'Menu & Food Ordering', icon: User },
                    { id: 'kitchen', label: 'Kitchen', desc: 'Kitchen Display (KDS)', icon: ChefHat },
                    { id: 'rider', label: 'Rider', desc: 'Delivery Dispatch Portal', icon: Bike },
                    { id: 'admin', label: 'Admin', desc: 'Full Kitchen Admin Page', icon: ShieldAlert }
                  ].map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id as UserRole)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedRole === r.id
                            ? 'border-emerald-700 bg-white ring-1 ring-emerald-700 font-bold text-emerald-950 shadow-2xs'
                            : 'border-stone-200 bg-white/70 hover:bg-white text-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{r.label}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mandatory Terms & Conditions Checkbox */}
              <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) setErrorMsg(null);
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-amber-400 text-emerald-700 focus:ring-emerald-700 cursor-pointer"
                  />
                  <div className="text-[11px] leading-snug text-stone-700">
                    {selectedRole === 'customer' && (
                      <>
                        <span className="font-bold text-stone-900">
                          I agree to the Customer Ordering Terms & Conditions
                        </span>{' '}
                        and FSSAI Food Safety Standards as per Firebase.{' '}
                      </>
                    )}
                    {selectedRole === 'kitchen' && (
                      <>
                        <span className="font-bold text-amber-950">
                          I agree to the Kitchen Staff Hygiene Guidelines & FSSAI Prep Conditions
                        </span>{' '}
                        (strict hygiene, hairnet/apron, pure mustard oil, and 20-min prep SLA).{' '}
                      </>
                    )}
                    {selectedRole === 'rider' && (
                      <>
                        <span className="font-bold text-blue-950">
                          I agree to the Rider Partner Delivery Agreement & Cash Remittance Conditions
                        </span>{' '}
                        (thermal bag handling, road safety rules, and prompt COD deposit).{' '}
                      </>
                    )}
                    {selectedRole === 'admin' && (
                      <>
                        <span className="font-bold text-purple-950">
                          I agree to the Administrator Governance Terms & FSSAI Oversight Conditions
                        </span>{' '}
                        (store governance authority, FSSAI compliance verification, and data security).{' '}
                      </>
                    )}
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-0.5 ml-1"
                    >
                      <FileText className="w-3 h-3 inline" />
                      <span>View Terms</span>
                    </button>
                  </div>
                </label>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[11px] font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Login Submit Button with OTP requirement enforcement */}
              <button
                type="submit"
                disabled={!termsAccepted || !otpSent || otp.length < 6 || isLoggingIn}
                className="w-full polish-green hover:bg-[#23482e] active:scale-[0.98] text-white py-3 rounded-xl font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <span>Verifying OTP & Logging in...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>VERIFY OTP & LOGIN AS {selectedRole.toUpperCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant Mobile Login • Firebase Firestore bhumi-f3ee0</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
