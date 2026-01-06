import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import type { MenuItem, MenuCategory, OrderItem, Discount } from '../types';
import {
  Plus,
  Minus,
  Trash2,
  Percent,
  Tag,
  X,
  Search,
  SendHorizonal,
  CheckCircle,
  ShoppingBag,
} from 'lucide-react';

export default function Cashier() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items?available=true'),
      ]);
      setCategories(catRes.data);
      setMenuItems(itemRes.data);
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.is_available;
  });

  const addToOrder = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.menuItemId === item.id);
      if (existing) {
        return prev.map((o) =>
          o.menuItemId === item.id ? { ...o, quantity: o.quantity + 1 } : o
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromOrder = (menuItemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const calculateDiscount = () => {
    if (appliedDiscount) {
      return appliedDiscount.type === 'percentage'
        ? (subtotal * appliedDiscount.value) / 100
        : appliedDiscount.value;
    }
    if (discountType && discountValue) {
      const value = parseFloat(discountValue);
      return discountType === 'percentage' ? (subtotal * value) / 100 : value;
    }
    return 0;
  };

  const discountAmount = calculateDiscount();
  const total = Math.max(0, subtotal - discountAmount);
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const applyPromoCode = async () => {
    if (!promoCode) return;
    try {
      const res = await api.get(`/menu/discounts/validate/${promoCode}`);
      setAppliedDiscount(res.data);
      setDiscountType(null);
      setDiscountValue('');
    } catch {
      alert('Invalid or expired promo code');
    }
  };

  const clearDiscount = () => {
    setAppliedDiscount(null);
    setDiscountType(null);
    setDiscountValue('');
    setPromoCode('');
  };

  const createOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/orders', {
        customerName: customerName || null,
        items: orderItems,
        discountId: appliedDiscount?.id || null,
        discountAmount,
      });

      setLastOrderNumber(res.data.order_number);
      setShowSuccess(true);
    } catch (error) {
      console.error('Order creation failed:', error);
      alert('Failed to create order');
    } finally {
      setProcessing(false);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    clearDiscount();
    setShowSuccess(false);
    setLastOrderNumber(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-6rem)]">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Search bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40" size={22} />
            <input
              type="text"
              placeholder="Search menu..."
              className="input input-bordered input-lg w-full pl-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 category-scroll">
          <button
            className={`btn btn-lg whitespace-nowrap flex-shrink-0 ${
              !selectedCategory ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-lg whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto order-scroll">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className="card bg-base-100 shadow-md menu-item-card text-left"
                onClick={() => addToOrder(item)}
              >
                {item.image_url ? (
                  <figure className="h-28 md:h-32 bg-base-200">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </figure>
                ) : (
                  <figure className="h-28 md:h-32 bg-base-200 flex items-center justify-center">
                    <ShoppingBag size={32} className="text-base-content/20" />
                  </figure>
                )}
                <div className="card-body p-3 md:p-4">
                  <h3 className="font-semibold text-base md:text-lg line-clamp-2">{item.name}</h3>
                  <p className="text-primary font-bold text-lg md:text-xl">{formatCurrency(item.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order Panel */}
      <div className="w-full lg:w-[420px] xl:w-[480px] flex flex-col bg-base-100 rounded-2xl shadow-xl">
        {/* Order header */}
        <div className="p-4 md:p-5 border-b border-base-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-xl md:text-2xl">New Order</h2>
            {itemCount > 0 && (
              <span className="badge badge-primary badge-lg">{itemCount} items</span>
            )}
          </div>
          <input
            type="text"
            placeholder="Customer name (optional)"
            className="input input-bordered input-lg w-full text-lg"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Order items */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 order-scroll">
          {orderItems.length === 0 ? (
            <div className="text-center text-base-content/50 py-12">
              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg">Tap menu items to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="cart-item flex items-center gap-3 bg-base-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base md:text-lg truncate">{item.name}</p>
                    <p className="text-sm text-base-content/60">
                      {formatCurrency(item.unitPrice)} each
                    </p>
                  </div>
                  
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-circle btn-sm btn-outline qty-btn"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-10 text-center font-bold text-xl">{item.quantity}</span>
                    <button
                      className="btn btn-circle btn-sm btn-outline qty-btn"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => removeFromOrder(item.menuItemId)}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order summary and actions */}
        <div className="p-4 md:p-5 border-t border-base-200 space-y-4 bg-base-50">
          {/* Promo code */}
          <div className="flex gap-2">
            <div className="join flex-1">
              <input
                type="text"
                placeholder="Promo code"
                className="input input-bordered join-item flex-1"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={!!appliedDiscount}
              />
              <button
                className="btn btn-primary join-item"
                onClick={applyPromoCode}
                disabled={!!appliedDiscount || !promoCode}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Manual discount */}
          {!appliedDiscount && (
            <div className="flex gap-2">
              <button
                className={`btn flex-1 ${discountType === 'percentage' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setDiscountType(discountType === 'percentage' ? null : 'percentage')}
              >
                <Percent size={18} /> Percent
              </button>
              <button
                className={`btn flex-1 ${discountType === 'fixed' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setDiscountType(discountType === 'fixed' ? null : 'fixed')}
              >
                <Tag size={18} /> Fixed RM
              </button>
              {discountType && (
                <input
                  type="number"
                  placeholder="Value"
                  className="input input-bordered w-24"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Applied discount display */}
          {(appliedDiscount || discountAmount > 0) && (
            <div className="flex items-center justify-between py-2 px-3 bg-success/10 rounded-lg">
              <span className="text-success font-medium">
                Discount: -{formatCurrency(discountAmount)}
              </span>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={clearDiscount}>
                <X size={18} />
              </button>
            </div>
          )}

          <div className="divider my-2"></div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-2xl pt-2 border-t border-base-300">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              className="btn btn-lg btn-outline flex-1" 
              onClick={clearOrder}
              disabled={orderItems.length === 0}
            >
              Clear
            </button>
            <button
              className="btn btn-lg btn-primary flex-1"
              onClick={createOrder}
              disabled={processing || orderItems.length === 0}
            >
              {processing ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <>
                  <SendHorizonal size={22} /> New Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && lastOrderNumber && (
        <div className="modal modal-open">
          <div className="modal-box text-center max-w-md">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-24 h-24 text-success success-icon" />
            </div>
            <h3 className="font-bold text-2xl mb-3">Order Created!</h3>
            <p className="text-6xl font-bold text-primary mb-4">
              #{lastOrderNumber}
            </p>
            <p className="text-lg text-base-content/60 mb-8">
              The order has been sent to the kitchen.
            </p>
            <div className="modal-action justify-center">
              <button className="btn btn-lg btn-primary btn-wide" onClick={clearOrder}>
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
