import React, { useState } from 'react';
import { MenuItem, Order, OrderStatus } from '../types';
import { DEFAULT_MENU_ITEMS } from '../data/defaultMenu';
import { seedMenuItemsToFirestore, updateOrderStatus } from '../firebase';
import { X, ChefHat, UploadCloud, Plus, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';

interface KitchenAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOrder: Order | null;
  orders: Order[];
  onAddNewItem: (item: MenuItem) => void;
  onRefreshOrders?: () => void;
}

export const KitchenAdminModal: React.FC<KitchenAdminModalProps> = ({
  isOpen,
  onClose,
  activeOrder,
  orders,
  onAddNewItem
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'addItem' | 'seed'>('orders');
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Form for adding new menu item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Lunch');
  const [newItemPrice, setNewItemPrice] = useState('180');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemDiet, setNewItemDiet] = useState<'veg' | 'non-veg'>('veg');
  const [newItemImage, setNewItemImage] = useState('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600');

  if (!isOpen) return null;

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedStatus('Connecting to Firebase Firestore (bhumi-f3ee0)...');
    try {
      const count = await seedMenuItemsToFirestore(DEFAULT_MENU_ITEMS);
      setSeedStatus(`Successfully seeded ${count} dishes to Firestore menuItems!`);
    } catch (err: any) {
      setSeedStatus(`Seeding status: saved locally (Firestore: ${err?.message || 'offline'})`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    await updateOrderStatus(orderId, nextStatus);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const created: MenuItem = {
      id: 'custom_' + Date.now(),
      name: newItemName.trim(),
      category: newItemCategory,
      categories: [newItemCategory, 'All Time'],
      description: newItemDesc.trim() || 'Delicious homestyle special cooked fresh to order.',
      price: Number(newItemPrice) || 150,
      imageUrl: newItemImage.trim(),
      rating: 4.8,
      ratingCount: 1,
      dietary: newItemDiet,
      isAvailable: true,
      portion: 'Serves 1-2',
      prepTimeMinutes: 20,
      spiceLevel: 'Medium'
    };

    onAddNewItem(created);
    setNewItemName('');
    setNewItemDesc('');
    alert(`🎉 Dish "${created.name}" added to menu!`);
    setActiveTab('orders');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="polish-green text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <ChefHat className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-sm">Bhumi Kitchen Operations Panel</h3>
              <p className="text-[10px] text-emerald-200">
                Firestore bhumi-f3ee0 Dispatch & Live Menu Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3 border-b-2 transition ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Live Kitchen Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('addItem')}
            className={`py-2 px-3 border-b-2 transition ${
              activeTab === 'addItem'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            + Add New Dish
          </button>
          <button
            onClick={() => setActiveTab('seed')}
            className={`py-2 px-3 border-b-2 transition ${
              activeTab === 'seed'
                ? 'border-emerald-700 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Sync / Seed to Firestore
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <p className="text-stone-500 text-[11px]">
                Advance order status to test live tracker updates in customer view!
              </p>

              {orders.length === 0 ? (
                <div className="p-8 text-center text-stone-400 border border-dashed rounded-xl">
                  No orders placed yet. Place an order in the cart to see it here!
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono font-bold text-emerald-900 text-xs">
                          {ord.orderId}
                        </span>
                        <p className="text-stone-600 font-semibold mt-0.5">
                          {ord.customerName} · {ord.customerPhone}
                        </p>
                        <p className="text-stone-500 text-[11px]">{ord.deliveryAddress}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-stone-900 text-xs">₹{ord.totalAmount}</span>
                        <p className="text-[10px] text-stone-500">{ord.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-600 bg-white p-2 rounded-lg border border-stone-200/60">
                      <strong>Items:</strong> {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>

                    {/* Status Stepper Controls */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="font-bold text-[10px] text-stone-500 mr-1">Status:</span>
                      {(['ORDER_PLACED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'] as OrderStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(ord.orderId, st)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                              ord.orderStatus === st
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            {st === 'ORDER_PLACED' && '1. Placed'}
                            {st === 'PREPARING' && '2. Cooking'}
                            {st === 'OUT_FOR_DELIVERY' && '3. Out'}
                            {st === 'DELIVERED' && '4. Delivered'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'addItem' && (
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chingri Malai Curry"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs bg-white"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Chef's Specials">Chef's Specials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Dietary Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemDiet('veg')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-[11px] ${
                        newItemDiet === 'veg'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemDiet('non-veg')}
                      className={`flex-1 py-1.5 rounded-lg border font-bold text-[11px] ${
                        newItemDiet === 'non-veg'
                          ? 'bg-red-50 border-red-600 text-red-800'
                          : 'border-stone-200 bg-stone-50 text-stone-600'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients and culinary description..."
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full polish-green text-white py-2.5 rounded-xl font-bold text-xs hover:bg-[#23482e] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Dish to Menu</span>
              </button>
            </form>
          )}

          {activeTab === 'seed' && (
            <div className="space-y-4">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                <h4 className="font-bold text-stone-900 text-xs">
                  Upload Default Homestyle Menu to Firestore
                </h4>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  Your project has connected to Firebase project <code>bhumi-f3ee0</code>.
                  Clicking below will upload our 13 authentic homestyle dishes (Kolkata Biryani, Kosha Mangsho, Luchi, Aloo Posto, Mishti Doi, etc.) directly into your Firestore <code>menuItems</code> collection so any real-time listener will instantly reflect them.
                </p>
                <button
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="polish-green text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-[#23482e] transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSeeding ? 'Seeding Firestore...' : 'Seed 13 Dishes to Firestore'}</span>
                </button>
              </div>

              {seedStatus && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-medium">
                  {seedStatus}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
