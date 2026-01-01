import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import type { MenuItem, MenuCategory, OrderItem, Discount } from '../types';
import {
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Percent,
  Tag,
  X,
  Search,
  CheckCircle,
  Printer,
} from 'lucide-react';

export default function Cashier() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState<{
    orderNumber: number;
    total: number;
    change: number;
  } | null>(null);

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
  const payment = parseFloat(paymentReceived) || 0;
  const change = payment - total;

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

  const processOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to the order');
      return;
    }
    if (payment < total) {
      alert('Payment amount is insufficient');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/orders', {
        customerName: customerName || null,
        items: orderItems,
        discountId: appliedDiscount?.id || null,
        discountAmount,
        paymentReceived: payment,
        paymentMethod,
      });

      setLastOrder({
        orderNumber: res.data.order_number,
        total: res.data.total_amount,
        change: res.data.change_given,
      });
      setShowReceipt(true);
    } catch (error) {
      console.error('Order failed:', error);
      alert('Failed to process order');
    } finally {
      setProcessing(false);
    }
  };

  const clearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setPaymentReceived('');
    clearDiscount();
    setShowReceipt(false);
    setLastOrder(null);
  };

  const quickPaymentAmounts = [10, 20, 50, 100];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
            <input
              type="text"
              placeholder="Search menu..."
              className="input input-bordered w-full pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            className={`btn btn-sm whitespace-nowrap touch-target ${
              !selectedCategory ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`btn btn-sm whitespace-nowrap touch-target ${
                selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'
              }`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                className="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer active:scale-95"
                onClick={() => addToOrder(item)}
              >
                {item.image_url && (
                  <figure className="h-24 bg-base-200">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </figure>
                )}
                <div className="card-body p-3">
                  <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                  <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-base-100 rounded-box shadow-lg">
        <div className="p-4 border-b border-base-200">
          <h2 className="font-bold text-lg mb-2">Current Order</h2>
          <input
            type="text"
            placeholder="Customer name (optional)"
            className="input input-bordered input-sm w-full"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {orderItems.length === 0 ? (
            <div className="text-center text-base-content/50 py-8">
              Tap menu items to add
            </div>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-base-content/60">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-xs btn-circle btn-ghost"
                      onClick={() => updateQuantity(item.menuItemId, -1)}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <button
                      className="btn btn-xs btn-circle btn-ghost"
                      onClick={() => updateQuantity(item.menuItemId, 1)}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      className="btn btn-xs btn-circle btn-ghost text-error"
                      onClick={() => removeFromOrder(item.menuItemId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="font-bold text-sm w-20 text-right">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-base-200 space-y-3">
          <div className="flex gap-2">
            <div className="join flex-1">
              <input
                type="text"
                placeholder="Promo code"
                className="input input-bordered input-sm join-item flex-1"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={!!appliedDiscount}
              />
              <button
                className="btn btn-sm btn-primary join-item"
                onClick={applyPromoCode}
                disabled={!!appliedDiscount || !promoCode}
              >
                Apply
              </button>
            </div>
          </div>

          {!appliedDiscount && (
            <div className="flex gap-2">
              <button
                className={`btn btn-sm flex-1 ${discountType === 'percentage' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setDiscountType(discountType === 'percentage' ? null : 'percentage')}
              >
                <Percent size={14} /> %
              </button>
              <button
                className={`btn btn-sm flex-1 ${discountType === 'fixed' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setDiscountType(discountType === 'fixed' ? null : 'fixed')}
              >
                <Tag size={14} /> RM
              </button>
              {discountType && (
                <input
                  type="number"
                  placeholder="Value"
                  className="input input-bordered input-sm w-20"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              )}
            </div>
          )}

          {(appliedDiscount || discountAmount > 0) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-success">
                Discount: -{formatCurrency(discountAmount)}
              </span>
              <button className="btn btn-xs btn-ghost" onClick={clearDiscount}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="divider my-2"></div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="divider my-2"></div>

          <div className="flex gap-2">
            <button
              className={`btn btn-sm flex-1 ${paymentMethod === 'cash' ? 'btn-info' : 'btn-outline'}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote size={16} /> Cash
            </button>
            <button
              className={`btn btn-sm flex-1 ${paymentMethod === 'card' ? 'btn-info' : 'btn-outline'}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={16} /> Card
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {quickPaymentAmounts.map((amount) => (
              <button
                key={amount}
                className="btn btn-sm btn-outline flex-1"
                onClick={() => setPaymentReceived(amount.toString())}
              >
                RM{amount}
              </button>
            ))}
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text">Payment Received</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="input input-bordered"
              value={paymentReceived}
              onChange={(e) => setPaymentReceived(e.target.value)}
            />
          </div>

          {payment >= total && total > 0 && (
            <div className="alert alert-success py-2">
              <span className="font-bold">Change: {formatCurrency(change)}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn btn-outline flex-1" onClick={clearOrder}>
              Clear
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={processOrder}
              disabled={processing || orderItems.length === 0 || payment < total}
            >
              {processing ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <CheckCircle size={18} /> Pay
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showReceipt && lastOrder && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-center">Order Complete!</h3>
            <div className="py-4 text-center">
              <p className="text-4xl font-bold text-primary mb-2">
                #{lastOrder.orderNumber}
              </p>
              <p className="text-lg">Total: {formatCurrency(lastOrder.total)}</p>
              <p className="text-2xl font-bold text-success">
                Change: {formatCurrency(lastOrder.change)}
              </p>
            </div>
            <div className="modal-action justify-center gap-4">
              <button className="btn btn-outline">
                <Printer size={18} /> Print Receipt
              </button>
              <button className="btn btn-primary" onClick={clearOrder}>
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
