import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  updateUserProfileInFirestore,
  recordTermsAcceptanceInFirestore,
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  FirebasePhoneConfirmation
} from '../firebase';
import {
  ChefHat,
  Bike,
  ShieldAlert,
  Utensils,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  FileText,
  Lock,
  KeyRound,
  Send
} from 'lucide-react';

interface SectionLoginGateProps {
  sectionRole: UserRole;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onOpenTerms: () => void;
  onNavigateToCustomerMenu?: () => void;
}

export const SectionLoginGate: React.FC<SectionLoginGateProps> = ({
  sectionRole,
  currentUser,
  onLoginSuccess,
  onOpenTerms,
  onNavigateToCustomerMenu
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<FirebasePhoneConfirmation | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default suggested names & numbers based on role
  useEffect(() => {
    const savedPhone = localStorage.getItem('bhumi_cust_phone') || (currentUser?.phone ? currentUser.phone.replace('+91', '') : '9006759560');
    setPhone(savedPhone);

    if (currentUser?.name) {
      setName(currentUser.name);
    } else {
      if (sectionRole === 'kitchen') setName('Head Chef Apu');
      else if (sectionRole === 'rider') setName('Rider Partner');
      else if (sectionRole === 'admin') setName('Kitchen Admin');
      else setName('Apu De');
    }
    setTermsAccepted(false);
    setOtp('');
    setOtpSent(false);
    setConfirmationResult(null);
    setErrorMessage(null);
  }, [sectionRole, currentUser]);

  const handleSendOtp = async () => {
    const clean = phone.trim().replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number before requesting OTP.');
      return;
    }
    setIsSendingOtp(true);
    setErrorMessage(null);
    try {
      const result = await sendFirebasePhoneOtp(clean, 'recaptcha-gate-container');
      setConfirmationResult(result);
      setOtpSent(true);
      setOtp(''); // Auto-fill explicitly disabled per user request
    } catch (err: any) {
      console.error('Firebase OTP send error:', err);
      setErrorMessage(err?.message || 'Failed to send Firebase OTP. Please check your number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const config = {
    customer: {
      title: 'Customer Feast Account Login',
      badge: 'Customer Portal',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      description: 'Login to track your authentic homestyle orders, save addresses, and chat with kitchen support.',
      icon: Utensils,
      themeColor: 'polish-green',
      termsText: 'I accept the Customer Ordering Terms & Conditions and FSSAI Food Safety Policy',
      termsTitle: 'Customer Ordering Terms & Conditions and FSSAI Standards',
      conditionDetail: 'Ordering homestyle meals, 5-minute cancellation window, COD & Online UPI payment, FSSAI hygiene assurance.'
    },
    kitchen: {
      title: 'Kitchen Operations Login',
      badge: 'Live Kitchen Display (KDS)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      description: 'Authorized kitchen staff login required to accept new orders, update live preparation stages, and manage stock.',
      icon: ChefHat,
      themeColor: 'bg-amber-600',
      termsText: 'I accept the Kitchen Staff Hygiene Guidelines, Fresh Cooking Protocols, and FSSAI Preparation Conditions',
      termsTitle: 'Kitchen Staff Food Safety & Prep Conditions',
      conditionDetail: 'Strict adherence to personal hygiene, clean apron and hairnet, cold-pressed mustard oil usage, and 20-min prep SLA.'
    },
    rider: {
      title: 'Delivery Partner Login',
      badge: 'Rider Delivery Fleet',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      description: 'Delivery partner login required to pick up dispatched packages, navigate customer addresses, and mark orders delivered.',
      icon: Bike,
      themeColor: 'bg-blue-700',
      termsText: 'I accept the Rider Partner Delivery Agreement, Helmet/Road Safety Rules, and Cash Collection Conditions',
      termsTitle: 'Rider Delivery Partner & Cash Remittance Agreement',
      conditionDetail: 'Safe motorcycle transit, insulated thermal delivery bag handling, prompt order handover, and 100% cash reconciliation.'
    },
    admin: {
      title: 'Kitchen Administrator Login',
      badge: 'Full Store Administration',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      description: 'Administrative access required to update FSSAI license, configure restaurant hours, manage food menu, and oversee revenue.',
      icon: ShieldAlert,
      themeColor: 'bg-purple-700',
      termsText: 'I accept the Administrator Governance Terms, FSSAI License Oversight, and Store Security Conditions',
      termsTitle: 'Admin Store Governance & FSSAI Oversight Conditions',
      conditionDetail: 'Full store supervisory authority, FSSAI compliance verification, menu pricing oversight, and data confidentiality.'
    }
  }[sectionRole];

  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Enforce OTP requirement with Firebase
    if (!otpSent || !confirmationResult) {
      setErrorMessage('OTP verification is required for login. Please click "Send OTP" to receive your code via SMS.');
      return;
    }

    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code sent to your mobile phone.');
      return;
    }

    // Enforce check term and condition
    if (!termsAccepted) {
      setErrorMessage('Terms & Conditions checkbox is mandatory. Please check the box to agree before logging in.');
      return;
    }

    setIsSubmitting(true);

    try {
      await verifyFirebasePhoneOtp(confirmationResult, otp);
    } catch (verifyErr: any) {
      setIsSubmitting(false);
      setErrorMessage(verifyErr?.message || 'Invalid OTP code. Please check and try again.');
      return;
    }
    const fullPhone = `+91${cleanPhone.slice(-10)}`;
    const finalName = name.trim() || `${sectionRole.toUpperCase()} User`;

    const updatedUser: UserProfile = {
      phone: fullPhone,
      name: finalName,
      savedAddress: currentUser?.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
      isLoggedIn: true,
      loggedInAt: Date.now(),
      role: sectionRole,
      termsAccepted: true,
      termsAcceptedAt: Date.now()
    };

    // Update storage
    localStorage.removeItem('bhumi_logged_out');
    localStorage.setItem('bhumi_user', JSON.stringify(updatedUser));
    localStorage.setItem('bhumi_cust_name', finalName);
    localStorage.setItem('bhumi_cust_phone', cleanPhone.slice(-10));
    localStorage.setItem('bhumi_role', sectionRole);

    // Sync to Firestore users collection & record individual terms acceptance with correct term
    try {
      await updateUserProfileInFirestore(cleanPhone.slice(-10), {
        name: finalName,
        savedAddress: updatedUser.savedAddress,
        role: sectionRole,
        termsAccepted: true
      });
      await recordTermsAcceptanceInFirestore({
        phone: cleanPhone.slice(-10),
        name: finalName,
        role: sectionRole,
        source: 'login',
        termsTitle: config.termsTitle
      });
    } catch (err) {
      console.warn('Sync profile & terms to Firestore warning:', err);
    }

    setIsSubmitting(false);
    onLoginSuccess(updatedUser);
  };

  return (
    <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white rounded-3xl border border-stone-200 shadow-sm animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-stone-100">
        <div className={`w-14 h-14 rounded-2xl ${config.themeColor} text-white flex items-center justify-center shadow-xs shrink-0`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${config.badgeColor}`}>
              {config.badge}
            </span>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" />
              Login Required
            </span>
          </div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight">{config.title}</h2>
          <p className="text-xs text-stone-600 mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Role Notice if logged in under different role */}
      {currentUser?.isLoggedIn && currentUser.role !== sectionRole && (
        <div className="mb-5 p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              Currently logged in as <span className="uppercase font-black underline">{currentUser.role || 'customer'}</span> ({currentUser.name || currentUser.phone})
            </p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              To operate the {sectionRole.toUpperCase()} page, please verify your credentials and accept the terms below to switch to {sectionRole.toUpperCase()} role.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mobile Number & Send OTP Button */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" />
              <span>Mobile Number (OTP Verification Required)</span>
            </span>
            {otpSent && (
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                OTP Sent
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center border border-stone-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700 focus-within:border-emerald-700 bg-stone-50">
              <span className="px-3.5 py-2.5 bg-stone-100 text-stone-700 font-bold text-xs border-r border-stone-300">
                +91
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ''));
                  setOtpSent(false);
                  setConfirmationResult(null);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. 9006759560"
                maxLength={10}
                className="w-full px-3 py-2.5 text-xs text-stone-900 bg-transparent focus:outline-none font-medium"
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSendingOtp ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}</span>
            </button>
          </div>
        </div>

        {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
        <div id="recaptcha-gate-container"></div>

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

        {/* OTP Input Field */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Enter 6-Digit OTP</span>
            <span className="text-[10px] font-normal text-stone-500">(Required for login)</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value.replace(/\D/g, ''));
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={otpSent ? 'Enter the 6-digit code' : 'Click "Send OTP" above first'}
            className="w-full px-3.5 py-2.5 text-xs text-stone-900 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-widest text-base font-bold placeholder:tracking-normal placeholder:text-xs placeholder:font-normal"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-500" />
            <span>Name / Staff Identity</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={sectionRole === 'kitchen' ? 'e.g. Head Chef Apu' : sectionRole === 'rider' ? 'e.g. Delivery Partner' : sectionRole === 'admin' ? 'e.g. Kitchen Admin' : 'e.g. Apu De'}
            className="w-full px-3.5 py-2.5 text-xs text-stone-900 border border-stone-300 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {/* Selected Role Indicator */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
          <span className="text-stone-600 font-medium">Access Permission Role:</span>
          <span className="font-extrabold capitalize text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-300 shadow-2xs">
            {sectionRole} Account
          </span>
        </div>

        {/* MANDATORY Check Term & Condition Box */}
        <div className={`p-4 rounded-2xl border transition ${termsAccepted ? 'bg-emerald-50/80 border-emerald-300' : 'bg-stone-50 border-stone-300'}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (e.target.checked) setErrorMessage(null);
              }}
              className="mt-0.5 w-4 h-4 text-emerald-800 rounded border-stone-300 focus:ring-emerald-700 cursor-pointer"
            />
            <div className="text-xs select-none">
              <span className="font-bold text-stone-900">
                {config.termsText}
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {config.conditionDetail} Specific conditions apply for {sectionRole.toUpperCase()} operations, collected individually and synchronized with Firebase Firestore.{' '}
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-emerald-800 font-bold underline hover:text-emerald-950 inline-flex items-center gap-0.5 ml-0.5 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  View Terms
                </button>
              </p>
            </div>
          </label>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
            termsAccepted && otpSent
              ? 'bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99]'
              : 'bg-stone-700 hover:bg-stone-800 opacity-90'
          }`}
        >
          {isSubmitting ? (
            <span>Verifying OTP & Logging In...</span>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>VERIFY OTP & LOGIN AS {sectionRole.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Navigation Helpers */}
        {onNavigateToCustomerMenu && sectionRole !== 'customer' && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToCustomerMenu}
              className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              ← Back to Customer Feast Menu
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
