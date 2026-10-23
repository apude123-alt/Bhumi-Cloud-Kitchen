import React, { useState, useEffect } from 'react';
import { RestaurantSettings, RestaurantDetails } from '../firebase';
import {
  X,
  ShieldCheck,
  FileText,
  Utensils,
  ChefHat,
  Bike,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

export type TermsRoleTab = 'customer' | 'kitchen' | 'rider' | 'admin';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: RestaurantSettings | null;
  restaurantDetails?: RestaurantDetails | null;
  initialTab?: TermsRoleTab;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  settings,
  restaurantDetails,
  initialTab = 'customer'
}) => {
  const [activeTab, setActiveTab] = useState<TermsRoleTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const fssaiNo = restaurantDetails?.fassaiLicenseNo || '12345678901233';

  const termsContent: Record<
    TermsRoleTab,
    {
      title: string;
      badge: string;
      badgeColor: string;
      icon: React.ComponentType<{ className?: string }>;
      subtitle: string;
      terms: { heading: string; detail: string }[];
    }
  > = {
    customer: {
      title: 'Customer Terms & Conditions',
      badge: 'Customer Ordering Policy',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Utensils,
      subtitle: 'Ordering, Food Safety, Hygiene Guarantees & Cancellation Policy',
      terms: [
        {
          heading: '1. Authentic Homestyle Cooking & Purity Standard',
          detail:
            'All meals are freshly prepared on order using 100% pure cold-pressed kachi ghani mustard oil and authentic homestyle Bengali and Bihari recipes. No artificial food colors, MSG, or synthetic preservatives are ever used.'
        },
        {
          heading: '2. Food Safety & FSSAI Standards',
          detail: `All dishes are prepared and packed in compliance with the Food Safety and Standards Authority of India (FSSAI License No: ${fssaiNo}). Cookware is stainless steel and food is delivered in tamper-evident sealed containers.`
        },
        {
          heading: '3. Pricing & Doorstep Delivery',
          detail: `Orders are prepared fresh. Free delivery is provided on orders above ₹${settings?.freeDeliveryAbove || 100} within ${settings?.maxDeliveryDistanceKm || 6} km.`
        },
        {
          heading: '4. Payment Methods',
          detail: 'We accept Cash on Delivery (COD) and direct UPI / QR Code scan payments upon doorstep delivery.'
        },
        {
          heading: '5. Cancellation Policy',
          detail: `Free cancellation is permitted within ${settings?.cancellationWindowMinutes || 5} minutes of placing your order, before cooking commences.`
        },
        {
          heading: '6. Freshness & Tamper-Evident Seal',
          detail: 'Dishes are transported in moisture-controlled, thermal insulated packaging preserving fresh aroma and warmth.'
        }
      ]
    },
    kitchen: {
      title: 'Kitchen Terms & Conditions',
      badge: 'Kitchen Food Safety & SLA',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: ChefHat,
      subtitle: 'Staff Food Prep, Sanitization & Culinary Hygiene Protocols',
      terms: [
        {
          heading: '1. Personal Hygiene & Mandatory Gear',
          detail:
            'Kitchen staff must wear clean hairnets, aprons, and sanitized gloves at all times during food handling. Nails trimmed and hands sanitized regularly.'
        },
        {
          heading: '2. Cooking Oil Purity Standard',
          detail:
            'Cook exclusively using pure cold-pressed mustard oil and desi cow ghee. Oil used for frying must never be reused under any circumstance.'
        },
        {
          heading: '3. Preparation SLA Compliance',
          detail:
            'Orders must be prepared fresh within 15–20 minutes to ensure riders can dispatch without transit delays.'
        },
        {
          heading: '4. Stainless Steel Cookware & Temperature SLA',
          detail:
            'All cooking is conducted in 100% food-grade stainless steel cookware. Hot dishes must be dispatched above 65°C.'
        },
        {
          heading: '5. FSSAI Compliance & Daily Facility Cleaning',
          detail:
            'Kitchen workstations, prep surfaces, and knives must be sanitized after every shift according to FSSAI hygiene guidelines.'
        }
      ]
    },
    rider: {
      title: 'Rider Terms & Conditions',
      badge: 'Delivery Partner Agreement',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      icon: Bike,
      subtitle: 'Fleet Safety, Transit Insulation & Doorstep Handover Standards',
      terms: [
        {
          heading: '1. Safe Transit & Rider Gear',
          detail:
            'Delivery partners must wear an ISI-certified helmet, maintain a registered vehicle with insurance, and follow all road safety regulations.'
        },
        {
          heading: '2. Insulated Thermal Delivery Box',
          detail:
            'Food containers must remain upright and sealed inside the insulated thermal delivery box until doorstep arrival to prevent spills and heat loss.'
        },
        {
          heading: '3. Contactless Doorstep Handover',
          detail:
            'Verify customer name and phone number before handover. Maintain courteous, respectful communication at all times.'
        },
        {
          heading: '4. Cash on Delivery (COD) Remittance',
          detail:
            '100% of cash collected from Cash on Delivery orders must be accounted for and deposited with kitchen dispatch at shift close.'
        },
        {
          heading: '5. Tamper-Evident Seal Integrity',
          detail:
            'Riders must never break or disturb the tamper-evident packaging seal. Any damaged container must be reported immediately.'
        }
      ]
    },
    admin: {
      title: 'Admin Terms & Conditions',
      badge: 'Store Governance & Oversight',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: ShieldAlert,
      subtitle: 'FSSAI License Oversight, Data Protection & Service Transparency',
      terms: [
        {
          heading: '1. FSSAI & Regulatory Governance',
          detail: `Maintain valid FSSAI Central/State registrations (License No: ${fssaiNo}) and display license numbers prominently on all customer receipts and digital channels.`
        },
        {
          heading: '2. Menu Transparency & Allergen Accuracy',
          detail:
            'Ensure all menu dishes feature honest dietary disclosures (Veg / Non-Veg / Egg), authentic recipe details, and transparent pricing.'
        },
        {
          heading: '3. Customer Data Privacy & Confidentiality',
          detail:
            'Customer contact numbers, order histories, and addresses must be strictly protected and never exported or sold to third parties.'
        },
        {
          heading: '4. Quality Grievance Redressal SLA',
          detail:
            'All customer feedback and quality concerns must be reviewed and resolved within 24 hours to maintain 4.9+ star service quality.'
        },
        {
          heading: '5. Multi-Hub Supervision',
          detail:
            'Regular hygiene and quality inspections must be conducted across Northern Town Central Kitchen, Sidhgora Hub, and New Cooch Behar Branch.'
        }
      ]
    }
  };

  const currentConfig = termsContent[activeTab];
  const CurrentIcon = currentConfig.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="polish-green text-white p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-300" />
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-white/20 bg-white/10 text-white">
                Official Terms & Conditions
              </span>
            </div>
            <h3 className="font-extrabold text-lg sm:text-xl tracking-tight">Terms & Conditions</h3>
            <p className="text-xs text-white/80 mt-0.5">
              Bhumi Cloud Kitchen • Select a Tab to View Specific Terms
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs: Customer, Kitchen, Rider, Admin */}
        <div className="grid grid-cols-4 border-b border-stone-200 bg-stone-50 text-xs font-bold shrink-0">
          {(['customer', 'kitchen', 'rider', 'admin'] as const).map((tabKey) => {
            const conf = termsContent[tabKey];
            const TabIcon = conf.icon;
            const isSelected = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 transition cursor-pointer border-b-2 text-center ${
                  isSelected
                    ? 'border-emerald-800 text-emerald-950 bg-white font-extrabold shadow-2xs'
                    : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-800' : 'text-stone-400'}`} />
                <span className="capitalize">{tabKey}</span>
              </button>
            );
          })}
        </div>

        {/* FSSAI Verified Compliance Banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold text-stone-900">FSSAI License:</span>
            <span className="font-mono font-extrabold text-emerald-900 bg-white px-2 py-0.5 rounded border border-amber-300">
              {fssaiNo}
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-700" />
            <span>FSSAI Certified Standards</span>
          </span>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700 leading-relaxed">
          {/* Active Tab Title & Badge */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center text-emerald-800 shrink-0">
                <CurrentIcon className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-black text-stone-900 text-sm sm:text-base">{currentConfig.title}</h4>
                <p className="text-[11px] text-stone-500">{currentConfig.subtitle}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${currentConfig.badgeColor} shrink-0`}>
              {activeTab.toUpperCase()}
            </span>
          </div>

          {/* List of Terms and Conditions */}
          <div className="border border-stone-200 p-4 rounded-2xl space-y-3 bg-stone-50/40">
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-emerald-800" />
              <span>Official {currentConfig.title}</span>
            </h4>
            <div className="space-y-3 pt-1">
              {currentConfig.terms.map((term, idx) => (
                <div key={idx} className="space-y-1 pb-2.5 border-b border-stone-100 last:border-b-0">
                  <p className="font-bold text-stone-800 text-xs">{term.heading}</p>
                  <p className="text-[11px] text-stone-600 leading-normal">{term.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Kitchen Facility Addresses & Contact Information */}
          <div className="pt-3 border-t border-stone-200 space-y-3 text-xs text-stone-600">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">
              Official Kitchen Facility Locations & Contact
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900 text-[11px]">1. Main Central Kitchen</p>
                <p className="text-[10px] text-stone-500">
                  Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur 831001
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900 text-[11px]">2. Sidhgora Cloud Hub</p>
                <p className="text-[10px] text-stone-500">
                  326 Bara Flat, Sidhgora, Jamshedpur, Jharkhand 831009
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <p className="font-bold text-stone-900 text-[11px]">3. New Cooch Behar Branch</p>
                <p className="text-[10px] text-stone-500">
                  Main Station Rd, New Cooch Behar, West Bengal 736101
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs pt-1">
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-semibold text-stone-800">{restaurantDetails?.phone || '+91 9006759560'}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-stone-700">apu.de123@gmail.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-stone-500 hidden sm:block">
            Official Bhumi Cloud Kitchen standards & guidelines across all categories.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="polish-green text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-[#23482e] transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
