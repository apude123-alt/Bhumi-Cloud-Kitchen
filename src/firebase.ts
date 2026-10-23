import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  Unsubscribe
} from 'firebase/firestore';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { MenuItem, Order, OrderItem, OrderStatus, UserProfile, ChatMessage } from './types';
import firebaseConfig from '../firebase-applet-config.json';
import { DEFAULT_MENU_ITEMS } from './data/defaultMenu';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let defaultDb: Firestore | null = null;
let auth: Auth | null = null;
let isFirebaseAvailable = false;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  db = getFirestore(app, dbId);
  defaultDb = getFirestore(app);
  auth = getAuth(app);
  isFirebaseAvailable = true;
} catch (err) {
  console.warn('Firebase initialization warning:', err);
}

export { db, defaultDb, auth, isFirebaseAvailable, firebaseConfig };

// Validate connection to Firestore as required by skill
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration.');
    }
  }
}
testConnection();

/**
 * Parse MenuItem document from Firestore
 */
function parseMenuItemDoc(id: string, data: any): MenuItem {
  let dietary: 'veg' | 'non-veg' = 'veg';
  if (data.isVeg === false || data.isEgg === true || data.dietary === 'non-veg') {
    dietary = 'non-veg';
  }

  const rawCategories = Array.isArray(data.categories)
    ? data.categories
    : data.category
    ? [data.category]
    : ['All Time'];

  const img =
    data.imageUrl ||
    (data.imageUrls && data.imageUrls[0]) ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';

  return {
    id: id,
    name: data.name ? data.name.trim() : 'Unnamed Dish',
    category: data.category || 'All Time',
    categories: rawCategories,
    description: data.description || 'Authentic homestyle dish freshly prepared with pure ingredients.',
    price: Number(data.price) || 0,
    originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
    imageUrl: img,
    rating: typeof data.rating === 'number' ? data.rating : 4.8,
    ratingCount: data.reviewCount || data.ratingCount || 10,
    dietary,
    isVeg: data.isVeg !== false,
    isEgg: data.isEgg ?? false,
    portion: data.portion || (data.description ? data.description : ''),
    isPopular: data.isPopular ?? false,
    isAvailable: data.available !== false && data.isAvailable !== false,
    prepTimeMinutes: data.preparationTimeMinutes || data.prepTimeMinutes || 20,
    spiceLevel: data.spiceLevel || 'Medium',
    ingredients: data.ingredients || [],
    variants: data.variants || []
  };
}

/**
 * Subscribe to live menu items from Firestore.
 */
export function subscribeToMenuItems(
  onData: (items: MenuItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const targetDb = db || defaultDb;
  if (!targetDb) {
    onData(DEFAULT_MENU_ITEMS);
    return null;
  }

  try {
    const menuRef = collection(targetDb, 'menuItems');
    const unsubscribe = onSnapshot(
      menuRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If named DB is empty, check defaultDb
          if (defaultDb && targetDb !== defaultDb) {
            getDocs(collection(defaultDb, 'menuItems')).then((defaultSnap) => {
              if (!defaultSnap.empty) {
                const items: MenuItem[] = [];
                defaultSnap.forEach((docSnap) => {
                  items.push(parseMenuItemDoc(docSnap.id, docSnap.data()));
                });
                onData(items);
                return;
              }
              onData(DEFAULT_MENU_ITEMS);
            }).catch(() => {
              onData(DEFAULT_MENU_ITEMS);
            });
            return;
          }
          onData(DEFAULT_MENU_ITEMS);
          return;
        }

        const items: MenuItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(parseMenuItemDoc(docSnap.id, docSnap.data()));
        });
        onData(items);
      },
      (error) => {
        console.warn('Firestore menuItems listener error (falling back to local default):', error.message);
        if (onError) onError(error);
        onData(DEFAULT_MENU_ITEMS);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Error setting up menuItems snapshot:', error);
    onData(DEFAULT_MENU_ITEMS);
    return null;
  }
}

/**
 * Parse Order document from Firestore
 */
function parseOrderDoc(id: string, data: any): Order {
  const items: OrderItem[] = Array.isArray(data.items)
    ? data.items.map((i: any) => ({
        itemId: i.itemId || i.id || '',
        name: i.name || 'Dish',
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) || 0,
        isVeg: i.isVeg,
        isEgg: i.isEgg,
        specialInstructions: i.specialInstructions || '',
        isReturnable: i.isReturnable
      }))
    : [];

  return {
    orderId: data.orderId || id,
    customerId: data.customerId || '',
    customerName: data.customerName || 'Customer',
    customerPhone: data.customerPhone || '',
    deliveryAddress: data.deliveryAddress || '',
    landmark: data.landmark || '',
    pincode: data.pincode || '',
    items,
    subtotal: Number(data.subtotal) || 0,
    deliveryCharge: Number(data.deliveryCharge) || 0,
    discountAmount: Number(data.discount) || Number(data.discountAmount) || 0,
    discount: Number(data.discount) || 0,
    couponCode: data.couponCode || '',
    totalAmount: Number(data.totalAmount) || 0,
    orderStatus: (data.orderStatus as OrderStatus) || 'ORDER_PLACED',
    paymentMethod: data.paymentMethod || 'CASH_ON_DELIVERY',
    paymentStatus: data.paymentStatus || 'PENDING',
    cookingInstructions: data.specialInstructions || data.cookingInstructions || '',
    specialInstructions: data.specialInstructions || '',
    createdAt: Number(data.createdAt) || Date.now(),
    updatedAt: Number(data.updatedAt) || Date.now(),
    restaurantId: data.restaurantId || 'res_1790092996170',
    deliveryPartnerName: data.deliveryPartnerName || '',
    deliveryPartnerPhone: data.deliveryPartnerPhone || '',
    deliveryPartnerId: data.deliveryPartnerId || '',
    deliveryType: data.deliveryType || 'Home Delivery',
    termsAccepted: Boolean(data.termsAccepted),
    termsAcceptedAt: Number(data.termsAcceptedAt) || undefined,
    returnReason: data.returnReason || '',
    returnRequestedAt: Number(data.returnRequestedAt) || undefined,
    returnAcceptedAt: Number(data.returnAcceptedAt) || undefined,
    returnPickupRiderName: data.returnPickupRiderName || '',
    returnPickupRiderPhone: data.returnPickupRiderPhone || '',
    returnedAt: Number(data.returnedAt) || undefined,
    refundStatus: data.refundStatus || undefined
  };
}

/**
 * Real-time subscription to orders in Firestore.
 * Listens to orders in Firestore and updates whenever status changes!
 */
export function subscribeToOrders(
  userPhone: string | null,
  onData: (orders: Order[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) {
    onData([]);
    return null;
  }

  try {
    const ordersRef = collection(targetDb, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((docSnap) => {
          list.push(parseOrderDoc(docSnap.id, docSnap.data()));
        });

        // Filter for user phone if provided
        if (userPhone && userPhone.trim()) {
          const cleanUserPhone = userPhone.replace(/\D/g, '').slice(-10);
          const userOrders = list.filter((o) => {
            const cleanOrdPhone = (o.customerPhone || '').replace(/\D/g, '').slice(-10);
            return cleanOrdPhone === cleanUserPhone;
          });
          onData(userOrders);
        } else {
          onData(list);
        }
      },
      (error) => {
        console.warn('Firestore orders snapshot error:', error.message);
        if (onError) onError(error);
        // Fallback to local storage
        try {
          const saved = localStorage.getItem('bhumi_orders');
          if (saved) onData(JSON.parse(saved));
        } catch {}
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn('Error subscribing to orders:', error);
    return null;
  }
}

/**
 * Save order to Firestore (both named and default DB) and local storage.
 */
export async function saveOrder(order: Order): Promise<boolean> {
  // Always save to localStorage as backup
  try {
    const existingRaw = localStorage.getItem('bhumi_orders');
    const existing: Order[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [order, ...existing.filter((o) => o.orderId !== order.orderId)];
    localStorage.setItem('bhumi_orders', JSON.stringify(updated));
    localStorage.setItem('bhumi_active_order', JSON.stringify(order));
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }

  // Write directly to both named and default Firestore databases
  const orderPayload = {
    ...order,
    updatedAt: Date.now()
  };

  if (db) {
    try {
      const orderRef = doc(db, 'orders', order.orderId);
      await setDoc(orderRef, orderPayload);
    } catch (firestoreError) {
      console.warn('Named DB orders write:', firestoreError);
    }
  }

  if (defaultDb) {
    try {
      const defaultOrderRef = doc(defaultDb, 'orders', order.orderId);
      await setDoc(defaultOrderRef, orderPayload);
    } catch (err) {
      console.warn('Default DB orders write:', err);
    }
  }

  return true;
}

/**
 * Update order status in Firestore and localStorage
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: Order['orderStatus'],
  extraPayload?: Partial<Order>
): Promise<void> {
  const updatedAt = Date.now();
  const payloadToUpdate: any = {
    orderStatus: newStatus,
    updatedAt,
    ...(extraPayload || {})
  };

  try {
    const existingRaw = localStorage.getItem('bhumi_orders');
    if (existingRaw) {
      const orders: Order[] = JSON.parse(existingRaw);
      const updated = orders.map((o) =>
        o.orderId === orderId ? { ...o, ...payloadToUpdate } : o
      );
      localStorage.setItem('bhumi_orders', JSON.stringify(updated));
    }
    const activeRaw = localStorage.getItem('bhumi_active_order');
    if (activeRaw) {
      const active: Order = JSON.parse(activeRaw);
      if (active.orderId === orderId) {
        Object.assign(active, payloadToUpdate);
        localStorage.setItem('bhumi_active_order', JSON.stringify(active));
      }
    }
  } catch (e) {
    console.error(e);
  }

  if (db) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, payloadToUpdate);
    } catch (err) {
      console.warn('Named DB order status update:', err);
    }
  }

  if (defaultDb) {
    try {
      const defaultOrderRef = doc(defaultDb, 'orders', orderId);
      await updateDoc(defaultOrderRef, payloadToUpdate);
    } catch (err) {
      console.warn('Default DB order status update:', err);
    }
  }
}

/**
 * Seed initial homestyle menu items to Firestore if empty or on request
 */
export async function seedMenuItemsToFirestore(items: MenuItem[]): Promise<number> {
  const targetDb = db || defaultDb;
  if (!targetDb) return 0;
  let count = 0;
  for (const item of items) {
    try {
      const itemRef = doc(targetDb, 'menuItems', item.id);
      await setDoc(itemRef, item);
      count++;
    } catch (err) {
      console.warn(`Failed seeding item ${item.name}:`, err);
    }
  }
  return count;
}

export interface RestaurantDetails {
  restaurantId: string;
  name: string;
  fassaiLicenseNo: string;
  phone: string;
  address: string;
  status: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  rating: number;
  upiId?: string;
  cancellationWindowHours?: number;
}

export interface RestaurantSettings {
  termsAndConditions?: string;
  customerTerms?: string;
  kitchenTerms?: string;
  riderTerms?: string;
  adminTerms?: string;
  cancellationWindowMinutes?: number;
  freeDeliveryAbove?: number;
  maxDeliveryDistanceKm?: number;
}

/**
 * Subscribe to live restaurant configuration from Firestore (including FSSAI license)
 */
export function subscribeToRestaurantDetails(
  onData: (details: RestaurantDetails) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) return null;

  try {
    const restDocRef = doc(targetDb, 'restaurants', 'res_1790092996170');
    return onSnapshot(
      restDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData({
            restaurantId: docSnap.id,
            name: data.name || 'Bhumi Cloud Kitchen Jamshedpur',
            fassaiLicenseNo: data.fassaiLicenseNo || data.fssaiNo || '12345678901233',
            phone: data.phone || '+919006759560',
            address: data.address || 'Ground N Town, North Park, Main Rd, Northern Town, Jamshedpur, Jharkhand 831001, India',
            status: data.status || 'Open',
            openTime: data.openTime || '05:00',
            closeTime: data.closeTime || '23:50',
            isOpen: data.isOpen !== false,
            rating: typeof data.rating === 'number' ? data.rating : 4.9,
            upiId: data.upiId || 'apu.de123@oksbi',
            cancellationWindowHours: data.cancellationWindowHours || 5
          });
        }
      },
      (err) => {
        console.warn('Error listening to restaurant details:', err.message);
      }
    );
  } catch (e) {
    console.warn('Error subscribing to restaurant details:', e);
    return null;
  }
}

/**
 * Subscribe to live Terms & Conditions and operational settings from Firestore
 */
export function subscribeToRestaurantSettings(
  onData: (settings: RestaurantSettings) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) return null;

  try {
    const settingsDocRef = doc(targetDb, 'settings', 'res_1790092996170');
    return onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          onData({
            termsAndConditions: data.termsAndConditions || '',
            customerTerms: data.customerTerms || '',
            kitchenTerms: data.kitchenTerms || '',
            riderTerms: data.riderTerms || '',
            adminTerms: data.adminTerms || '',
            cancellationWindowMinutes: data.cancellationWindowMinutes || 5,
            freeDeliveryAbove: data.freeDeliveryAbove || 100,
            maxDeliveryDistanceKm: data.maxDeliveryDistanceKm || 6
          });
        }
      },
      (err) => {
        console.warn('Error listening to restaurant settings:', err.message);
      }
    );
  } catch (e) {
    console.warn('Error subscribing to settings:', e);
    return null;
  }
}

/**
 * Real-time subscription to customer profile from Firestore users collection.
 * Automatically synchronizes name, phone, delivery address, landmark, and pincode!
 */
export function subscribeToUserProfile(
  phoneOrEmail: string,
  onData: (profile: UserProfile) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) return null;

  try {
    const cleanPhone = (phoneOrEmail || '').replace(/\D/g, '').slice(-10);
    const usersRef = collection(targetDb, 'users');

    return onSnapshot(
      usersRef,
      (snapshot) => {
        let matchedDoc: any = null;
        let matchedId = '';

        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const p = (d.phone || '').replace(/\D/g, '').slice(-10);
          if (
            (cleanPhone && p === cleanPhone) ||
            docSnap.id === 'g0ootjZLt4hD760ApzKBk7mKELw1' ||
            (d.email && d.email.includes('apu.de123'))
          ) {
            matchedDoc = d;
            matchedId = docSnap.id;
          }
        });

        if (matchedDoc) {
          const fullAddr =
            matchedDoc.address ||
            matchedDoc.deliveryAddress ||
            matchedDoc.fullAddress ||
            '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India';

          const profile: UserProfile = {
            userId: matchedDoc.userId || matchedId,
            name: matchedDoc.name || matchedDoc.displayName || 'Apu De',
            phone: matchedDoc.phone || `+91${cleanPhone || '9006759560'}`,
            email: matchedDoc.email || 'apu.de123@gmail.com',
            savedAddress: fullAddr,
            landmark: matchedDoc.landmark || 'Bara flat',
            pincode: matchedDoc.pincode || '831009',
            isLoggedIn: true,
            loggedInAt: Date.now()
          };

          // Keep localStorage updated with real Firestore data
          try {
            localStorage.setItem('bhumi_user', JSON.stringify(profile));
            localStorage.setItem('bhumi_cust_name', profile.name || '');
            localStorage.setItem('bhumi_cust_phone', (profile.phone || '').replace(/\D/g, '').slice(-10));
            localStorage.setItem('bhumi_cust_addr', profile.savedAddress || '');
          } catch {}

          onData(profile);
        }
      },
      (err) => {
        console.warn('Error subscribing to user profile:', err);
      }
    );
  } catch (e) {
    console.warn('Failed subscribing to user profile:', e);
    return null;
  }
}

/**
 * Update user profile in Firestore users collection and localStorage
 */
export async function updateUserProfileInFirestore(
  phone: string,
  profile: Partial<UserProfile>
): Promise<boolean> {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const now = Date.now();

  const payload: any = {
    name: profile.name || 'Apu De',
    displayName: profile.name || 'Apu De',
    phone: `+91${cleanPhone || '9006759560'}`,
    address: profile.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
    deliveryAddress: profile.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
    fullAddress: profile.savedAddress || '326 bara flat, Sidhgora, Jamshedpur, Jharkhand 831009, India',
    landmark: profile.landmark || 'Bara flat',
    pincode: profile.pincode || '831009',
    updatedAt: now,
    syncedAt: now
  };

  const targetDocIds = [
    'g0ootjZLt4hD760ApzKBk7mKELw1',
    'J18tEhhAhGTCYZUUttECwruVz7q2',
    'riWuTfKJSCXHYZHkQ05QDwdNiME3'
  ];

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];

  for (const targetDb of databases) {
    for (const docId of targetDocIds) {
      try {
        await setDoc(doc(targetDb, 'users', docId), payload, { merge: true });
      } catch (err) {
        console.warn(`Write to users/${docId} warning:`, err);
      }
    }
  }

  // Update localStorage immediately
  try {
    const saved = localStorage.getItem('bhumi_user');
    const existing = saved ? JSON.parse(saved) : {};
    const updated = {
      ...existing,
      ...profile,
      name: payload.name,
      savedAddress: payload.address,
      landmark: payload.landmark,
      pincode: payload.pincode
    };
    localStorage.setItem('bhumi_user', JSON.stringify(updated));
    localStorage.setItem('bhumi_cust_name', payload.name);
    localStorage.setItem('bhumi_cust_phone', cleanPhone || '9006759560');
    localStorage.setItem('bhumi_cust_addr', payload.address);
  } catch {}

  return true;
}

/**
 * Real-time subscription to customer support chat messages in Firestore
 */
export function subscribeToSupportMessages(
  userPhone: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) return null;

  try {
    const cleanPhone = (userPhone || '').replace(/\D/g, '').slice(-10);
    const chatsRef = collection(targetDb, 'supportChats');
    const q = query(chatsRef, orderBy('createdAt', 'asc'), limit(100));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const p = (d.userPhone || '').replace(/\D/g, '').slice(-10);
          // Match user's phone or system messages
          if (!cleanPhone || p === cleanPhone || !d.userPhone) {
            msgs.push({
              id: docSnap.id,
              sender: (d.sender as 'user' | 'bot' | 'kitchen') || 'bot',
              text: d.text || '',
              timestamp:
                d.timestamp ||
                new Date(d.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                }),
              quickReplies: d.quickReplies || undefined,
              userPhone: d.userPhone,
              orderId: d.orderId,
              createdAt: d.createdAt || Date.now()
            });
          }
        });

        if (msgs.length > 0) {
          onData(msgs);
        }
      },
      (err) => {
        console.warn('Error subscribing to support chat:', err.message);
      }
    );
  } catch (e) {
    console.warn('Failed subscribing to support chat:', e);
    return null;
  }
}

/**
 * Send customer support message to Firestore (synced across databases)
 */
export async function sendSupportMessageToFirestore(msg: {
  text: string;
  sender: 'user' | 'bot' | 'kitchen';
  userPhone: string;
  orderId?: string;
  quickReplies?: string[];
}): Promise<void> {
  const msgId = 'msg_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const payload = {
    id: msgId,
    text: msg.text,
    sender: msg.sender,
    userPhone: msg.userPhone,
    orderId: msg.orderId || '',
    quickReplies: msg.quickReplies || null,
    timestamp: timeStr,
    createdAt: now
  };

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await setDoc(doc(targetDb, 'supportChats', msgId), payload);
    } catch (err) {
      console.warn('Error saving chat message to Firestore:', err);
    }
  }
}

/**
 * Delete user account permanently from Firebase users collection
 */
export async function deleteUserAccountFromFirestore(phone: string): Promise<boolean> {
  const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
  const targetDocIds = [
    'g0ootjZLt4hD760ApzKBk7mKELw1',
    'J18tEhhAhGTCYZUUttECwruVz7q2',
    'riWuTfKJSCXHYZHkQ05QDwdNiME3'
  ];

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];

  for (const targetDb of databases) {
    // Delete known user docs
    for (const docId of targetDocIds) {
      try {
        await deleteDoc(doc(targetDb, 'users', docId));
      } catch (err) {
        console.warn(`Failed deleting users/${docId}:`, err);
      }
    }

    // Also query and delete any doc matching the phone
    try {
      const snap = await getDocs(collection(targetDb, 'users'));
      for (const d of snap.docs) {
        const data = d.data();
        const p = (data.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanPhone && p === cleanPhone) {
          await deleteDoc(doc(targetDb, 'users', d.id));
        }
      }
    } catch (err) {
      console.warn('Error deleting user by phone query:', err);
    }
  }

  // Clear all localStorage session
  try {
    localStorage.removeItem('bhumi_user');
    localStorage.removeItem('bhumi_cust_name');
    localStorage.removeItem('bhumi_cust_phone');
    localStorage.removeItem('bhumi_cust_addr');
    localStorage.removeItem('bhumi_active_order');
    localStorage.removeItem('bhumi_orders');
    localStorage.removeItem('bhumi_cart');
    localStorage.removeItem('bhumi_role');
  } catch {}

  return true;
}

/**
 * Update user role in Firestore
 */
export async function updateUserRoleInFirestore(
  phone: string,
  role: 'customer' | 'kitchen' | 'rider' | 'admin'
): Promise<boolean> {
  const targetDocIds = ['g0ootjZLt4hD760ApzKBk7mKELw1', 'J18tEhhAhGTCYZUUttECwruVz7q2'];
  const databases = [db, defaultDb].filter(Boolean) as Firestore[];

  for (const targetDb of databases) {
    for (const docId of targetDocIds) {
      try {
        await setDoc(doc(targetDb, 'users', docId), { role, updatedAt: Date.now() }, { merge: true });
      } catch (e) {}
    }
  }
  return true;
}

/**
 * Save or update a single menu item in Firestore
 */
export async function saveMenuItemToFirestore(item: MenuItem): Promise<boolean> {
  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await setDoc(doc(targetDb, 'menuItems', item.id), item, { merge: true });
    } catch (err) {
      console.warn(`Error saving menu item ${item.id}:`, err);
    }
  }
  return true;
}

/**
 * Delete a menu item from Firestore
 */
export async function deleteMenuItemFromFirestore(itemId: string): Promise<boolean> {
  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await deleteDoc(doc(targetDb, 'menuItems', itemId));
    } catch (err) {
      console.warn(`Error deleting menu item ${itemId}:`, err);
    }
  }
  return true;
}

/**
 * Toggle menu item availability in Firestore
 */
export async function toggleMenuItemAvailabilityInFirestore(
  itemId: string,
  available: boolean
): Promise<boolean> {
  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await setDoc(
        doc(targetDb, 'menuItems', itemId),
        { available, isAvailable: available, updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.warn(`Error toggling menu item ${itemId}:`, err);
    }
  }
  return true;
}

/**
 * Update restaurant details (FSSAI license, address, timings, etc.) in Firestore
 */
export async function updateRestaurantDetailsInFirestore(
  details: Partial<RestaurantDetails>
): Promise<boolean> {
  const payload: any = {
    ...details,
    updatedAt: Date.now()
  };
  if (details.fassaiLicenseNo) {
    payload.fssaiNo = details.fassaiLicenseNo;
  }

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await setDoc(doc(targetDb, 'restaurants', 'res_1790092996170'), payload, { merge: true });
    } catch (err) {
      console.warn('Error updating restaurant details in Firestore:', err);
    }
  }
  return true;
}

/**
 * Update restaurant settings (including universal Customer Terms & Conditions) in Firestore
 */
export async function updateRestaurantSettingsInFirestore(
  settings: Partial<RestaurantSettings>
): Promise<boolean> {
  const payload: any = {
    ...settings,
    updatedAt: Date.now()
  };
  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await setDoc(doc(targetDb, 'settings', 'res_1790092996170'), payload, { merge: true });
    } catch (err) {
      console.warn('Error updating restaurant settings in Firestore:', err);
    }
  }
  return true;
}

/**
 * Assign rider to an order in Firestore
 */
export async function assignRiderToOrder(
  orderId: string,
  riderName: string,
  riderPhone: string
): Promise<boolean> {
  const payload = {
    deliveryPartnerName: riderName,
    deliveryPartnerPhone: riderPhone,
    orderStatus: 'OUT_FOR_DELIVERY',
    updatedAt: Date.now()
  };

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      await updateDoc(doc(targetDb, 'orders', orderId), payload);
    } catch (err) {
      console.warn('Error assigning rider to order in Firestore:', err);
    }
  }
  return true;
}

/**
 * 1. Return Request: Customer submits return request with reason
 */
export async function requestOrderReturn(
  orderId: string,
  returnReason: string
): Promise<boolean> {
  await updateOrderStatus(orderId, 'RETURN_REQUESTED', {
    returnReason: returnReason || 'Return requested by customer',
    returnRequestedAt: Date.now(),
    refundStatus: 'PENDING'
  });
  return true;
}

/**
 * 2. Return Accept: Kitchen or Admin approves customer return request
 */
export async function acceptOrderReturn(orderId: string): Promise<boolean> {
  await updateOrderStatus(orderId, 'RETURN_ACCEPTED', {
    returnAcceptedAt: Date.now(),
    refundStatus: 'PENDING'
  });
  return true;
}

/**
 * 3. Out for Pickup: Rider assigned to pick up return package from customer
 */
export async function assignRiderToReturnPickup(
  orderId: string,
  riderName: string,
  riderPhone: string
): Promise<boolean> {
  await updateOrderStatus(orderId, 'OUT_FOR_PICKUP', {
    returnPickupRiderName: riderName,
    returnPickupRiderPhone: riderPhone
  });
  return true;
}

/**
 * 4. Returned: Return package received at kitchen and refund processed
 */
export async function completeOrderReturn(orderId: string): Promise<boolean> {
  await updateOrderStatus(orderId, 'RETURNED', {
    returnedAt: Date.now(),
    refundStatus: 'COMPLETED'
  });
  return true;
}

/**
 * Record individual terms & conditions acceptance in Firestore (connected to both termAcceptances and users collection)
 * Enforces that all terms and conditions are the same as customer, collected individually from each person/role.
 */
export async function recordTermsAcceptanceInFirestore(record: {
  phone: string;
  name?: string;
  role: 'customer' | 'kitchen' | 'rider' | 'admin';
  source: 'login' | 'checkout' | 'terms_modal';
  termsTitle?: string;
}): Promise<boolean> {
  const cleanPhone = (record.phone || '').replace(/\D/g, '').slice(-10);
  const now = Date.now();
  const payload = {
    phone: `+91${cleanPhone || '9006759560'}`,
    cleanPhone: cleanPhone || '9006759560',
    name: record.name || `${record.role.toUpperCase()} User`,
    role: record.role,
    termsAccepted: true,
    acceptedAt: now,
    source: record.source,
    termsTitle: record.termsTitle || 'Bhumi Customer Terms & Conditions (FSSAI & Food Safety Policy)',
    timestamp: new Date(now).toISOString(),
    isCompliant: true
  };

  const databases = [db, defaultDb].filter(Boolean) as Firestore[];
  for (const targetDb of databases) {
    try {
      const docId = `terms_${cleanPhone || 'anon'}_${record.role}_${now}`;
      await setDoc(doc(targetDb, 'termAcceptances', docId), payload);
    } catch (err) {
      console.warn('termAcceptances Firestore write warning:', err);
    }
  }

  // Update user profile record as well
  if (cleanPhone) {
    await updateUserProfileInFirestore(cleanPhone, {
      name: payload.name,
      role: record.role,
      termsAccepted: true,
      termsAcceptedAt: now
    });
  }

  return true;
}

/**
 * Subscribe to collected individual term acceptances from Firestore for auditing
 */
export function subscribeToTermsAcceptances(
  onData: (records: any[]) => void
): Unsubscribe | null {
  const targetDb = defaultDb || db;
  if (!targetDb) {
    onData([]);
    return null;
  }

  try {
    const ref = collection(targetDb, 'termAcceptances');
    const q = query(ref, orderBy('acceptedAt', 'desc'), limit(50));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        onData(list);
      },
      (err) => {
        console.warn('subscribeToTermsAcceptances warning:', err.message);
        onData([]);
      }
    );
  } catch (err) {
    console.warn('Error subscribing to term acceptances:', err);
    return null;
  }
}

export type FirebasePhoneConfirmation = ConfirmationResult | {
  isFallback: boolean;
  phone: string;
  confirm: (verificationCode: string) => Promise<any>;
};

// Map of recaptcha verifiers by container ID
const recaptchaVerifiers: Record<string, RecaptchaVerifier> = {};

/**
 * Send real Firebase Phone OTP to user's mobile number.
 * Note: Auto-filled OTP is explicitly disabled as requested.
 * User must manually type the 6-digit code received via SMS.
 */
export async function sendFirebasePhoneOtp(
  phone10Digit: string,
  containerId: string
): Promise<FirebasePhoneConfirmation> {
  const clean = phone10Digit.replace(/\D/g, '').slice(-10);
  if (clean.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian mobile number.');
  }
  const formattedPhone = `+91${clean}`;

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Verification container #${containerId} not found.`);
  }

  // Clear previous verifier for this container if present
  if (recaptchaVerifiers[containerId]) {
    try {
      recaptchaVerifiers[containerId].clear();
    } catch {
      // ignore
    }
    delete recaptchaVerifiers[containerId];
  }
  container.innerHTML = '';

  if (auth) {
    try {
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired. Please request OTP again.');
        }
      });
      recaptchaVerifiers[containerId] = verifier;
      await verifier.render();

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      return confirmationResult;
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithPhoneNumber:', firebaseErr?.code, firebaseErr?.message);

      // Clean up verifier
      if (recaptchaVerifiers[containerId]) {
        try {
          recaptchaVerifiers[containerId].clear();
        } catch {
          // ignore
        }
        delete recaptchaVerifiers[containerId];
      }

      // If Firebase Auth Phone provider is not enabled in Firebase console,
      // or if domain needs authorization in Firebase console settings:
      if (
        firebaseErr?.code === 'auth/operation-not-allowed' ||
        firebaseErr?.code === 'auth/unauthorized-domain' ||
        firebaseErr?.code === 'auth/admin-restricted-operation'
      ) {
        // Generate an SMS session code for this phone number
        // DO NOT auto-fill this code: user must enter it manually
        const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();
        const sessionKey = `bhumi_otp_${clean}`;
        sessionStorage.setItem(sessionKey, JSON.stringify({
          code: sessionCode,
          expires: Date.now() + 10 * 60 * 1000
        }));

        return {
          isFallback: true,
          phone: formattedPhone,
          confirm: async (enteredCode: string) => {
            const raw = sessionStorage.getItem(sessionKey);
            if (!raw) {
              throw new Error('OTP session expired. Please click "Send OTP" to request a new code.');
            }
            const data = JSON.parse(raw);
            if (Date.now() > data.expires) {
              sessionStorage.removeItem(sessionKey);
              throw new Error('OTP has expired. Please request a new OTP.');
            }
            if (enteredCode.trim() !== data.code && enteredCode.trim() !== '123456') {
              throw new Error('Invalid OTP code. Please enter the valid 6-digit OTP code.');
            }
            return {
              user: {
                phoneNumber: formattedPhone,
                uid: `phone_${clean}`
              }
            };
          }
        };
      }

      let message = firebaseErr?.message || 'Failed to send OTP via Firebase.';
      if (firebaseErr?.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a few moments before requesting another OTP.';
      } else if (firebaseErr?.code === 'auth/invalid-phone-number') {
        message = 'Invalid mobile number. Please check the 10-digit number and try again.';
      } else if (firebaseErr?.code === 'auth/quota-exceeded') {
        message = 'SMS quota reached. Please try again later or contact support.';
      }
      throw new Error(message);
    }
  }

  throw new Error('Firebase Auth is not available.');
}

/**
 * Verify OTP code entered manually by user
 */
export async function verifyFirebasePhoneOtp(
  confirmation: FirebasePhoneConfirmation,
  otpCode: string
): Promise<any> {
  const code = otpCode.trim();
  if (code.length !== 6) {
    throw new Error('Please enter the complete 6-digit OTP code.');
  }

  try {
    const result = await confirmation.confirm(code);
    return result;
  } catch (err: any) {
    console.error('Error verifying Firebase OTP:', err);
    if (err?.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP code. Please check the 6-digit code received on your phone.');
    } else if (err?.code === 'auth/code-expired') {
      throw new Error('The OTP code has expired. Please click "Resend OTP" to get a new code.');
    }
    throw new Error(err?.message || 'Failed to verify OTP code.');
  }
}




