export type FoodCategory =
  | 'All Time'
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Snacks'
  | 'Beverages'
  | 'Desserts'
  | "Chef's Specials";

export type DietaryType = 'veg' | 'non-veg';

export interface ItemVariant {
  name: string;
  variantId: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categories?: string[];
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  rating: number;
  ratingCount?: number;
  dietary?: DietaryType;
  isVeg?: boolean;
  isEgg?: boolean;
  available?: boolean;
  isPopular?: boolean;
  isAvailable?: boolean;
  portion?: string;
  prepTimeMinutes?: number;
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy';
  ingredients?: string[];
  variants?: ItemVariant[];
}

export type UserRole = 'customer' | 'kitchen' | 'rider' | 'admin';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  cookingInstruction?: string;
  selectedVariant?: ItemVariant;
}

export type OrderStatus =
  | 'ORDER_PLACED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURN_ACCEPTED'
  | 'OUT_FOR_PICKUP'
  | 'RETURNED';

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  isVeg?: boolean;
  isEgg?: boolean;
  specialInstructions?: string;
  isReturnable?: boolean;
  selectedVariant?: ItemVariant;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  landmark?: string;
  pincode?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discountAmount?: number;
  discount?: number;
  couponCode?: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus?: string;
  cookingInstructions?: string;
  specialInstructions?: string;
  createdAt: number;
  updatedAt?: number;
  estimatedDeliveryMinutes?: number;
  restaurantId: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerId?: string;
  deliveryType?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: number;
  returnReason?: string;
  returnRequestedAt?: number;
  returnAcceptedAt?: number;
  returnPickupRiderName?: string;
  returnPickupRiderPhone?: string;
  returnedAt?: number;
  refundStatus?: 'PENDING' | 'PROCESSED' | 'COMPLETED';
}

export interface Coupon {
  code: string;
  title: string;
  subtitle: string;
  minOrder: number;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'kitchen';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  userPhone?: string;
  orderId?: string;
  createdAt?: number;
}

export interface TermAcceptanceRecord {
  id?: string;
  phone: string;
  name: string;
  role: UserRole;
  termsTitle: string;
  termsAccepted: boolean;
  acceptedAt: number;
  source: 'login' | 'checkout' | 'terms_modal';
  timestamp?: string;
}

export interface UserProfile {
  phone: string;
  name?: string;
  email?: string;
  savedAddress?: string;
  landmark?: string;
  pincode?: string;
  isLoggedIn: boolean;
  loggedInAt?: number;
  userId?: string;
  role?: UserRole;
  termsAccepted?: boolean;
  termsAcceptedAt?: number;
  termsAcceptedRole?: UserRole;
  termsTitle?: string;
}


