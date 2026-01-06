import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import type { Order, OrderStatus } from '../types';
import {
  Clock,
  ChefHat,
  CheckCircle,
  XCircle,
  CreditCard,
  Banknote,
  X,
  RefreshCw,
  Printer,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  IN_PROGRESS: { label: 'In Progress', color: 'badge-warning', bgColor: 'bg-warning/10', icon: Clock },
  READY: { label: 'Ready', color: 'badge-info', bgColor: 'bg-info/10', icon: ChefHat },
  COMPLETED: { label: 'Completed', color: 'badge-success', bgColor: 'bg-success/10', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'badge-error', bgColor: 'bg-error/10', icon: XCircle },
};

const getStatusConfig = (status: string | undefined) => {
  return statusConfig[status || ''] || { label: status || 'Unknown', color: 'badge-ghost', bgColor: 'bg-base-200', icon: Clock };
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      const res = await api.get(`/orders?${params.toString()}`);
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderId: string) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setProcessing(true);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status });
      setSelectedOrder(res.data);
      loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = () => {
    if (selectedOrder) {
      setPaymentReceived(selectedOrder.total_amount.toString());
      setShowPaymentModal(true);
    }
  };

  const processPayment = async () => {
    if (!selectedOrder) return;

    const payment = parseFloat(paymentReceived) || 0;
    if (payment < selectedOrder.total_amount) {
      alert('Payment amount is insufficient');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}/pay`, {
        paymentReceived: payment,
        paymentMethod,
      });
      setSelectedOrder(res.data);
      setShowPaymentModal(false);
      loadOrders();
    } catch (error) {
      console.error('Failed to process payment:', error);
      alert('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setShowPaymentModal(false);
    setPaymentReceived('');
  };

  const quickPaymentAmounts = [10, 20, 50, 100];
  const payment = parseFloat(paymentReceived) || 0;
  const change = selectedOrder ? payment - selectedOrder.total_amount : 0;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-MY', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Orders</h1>
          <button
            className="btn btn-ghost btn-circle"
            onClick={() => loadOrders()}
          >
            <RefreshCw size={22} />
          </button>
        </div>
        
        {/* Status filter tabs - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 category-scroll">
          {[
            { key: 'ALL', label: 'All Orders', color: 'btn-primary' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'btn-warning' },
            { key: 'READY', label: 'Ready', color: 'btn-info' },
            { key: 'COMPLETED', label: 'Completed', color: 'btn-success' },
          ].map((filter) => (
            <button
              key={filter.key}
              className={`btn btn-lg whitespace-nowrap flex-shrink-0 ${
                statusFilter === filter.key ? filter.color : 'btn-outline'
              }`}
              onClick={() => setStatusFilter(filter.key as OrderStatus | 'ALL')}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders grid */}
      {orders.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-16">
            <Clock size={48} className="mx-auto text-base-content/30 mb-4" />
            <p className="text-xl text-base-content/60">No orders found</p>
            <p className="text-base-content/40">Orders will appear here when created</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            const StatusIcon = config.icon;
            return (
              <div
                key={order.id}
                className={`card bg-base-100 shadow-lg order-card cursor-pointer ${config.bgColor} border-2 border-transparent hover:border-primary/20`}
                onClick={() => openOrderDetails(order.id)}
              >
                <div className="card-body p-5 md:p-6">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-primary">
                        #{order.order_number}
                      </h3>
                      <p className="text-base text-base-content/60 mt-1">
                        {order.customer_name || 'Walk-in'}
                      </p>
                    </div>
                    <span className={`badge badge-lg ${config.color} gap-1 status-badge`}>
                      <StatusIcon size={14} />
                      {config.label}
                    </span>
                  </div>
                  
                  <div className="divider my-3"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <span className="text-base text-base-content/50">
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                  
                  <button className="btn btn-lg btn-ghost w-full mt-3 gap-2">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && !showPaymentModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <button
              className="btn btn-circle btn-ghost absolute right-4 top-4 z-10"
              onClick={closeOrderDetails}
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pr-12">
              <div>
                <h3 className="text-4xl md:text-5xl font-bold text-primary">
                  #{selectedOrder.order_number}
                </h3>
                <p className="text-lg text-base-content/60 mt-1">
                  {selectedOrder.customer_name || 'Walk-in Customer'}
                </p>
              </div>
              <span className={`badge badge-lg ${getStatusConfig(selectedOrder.status).color} self-start sm:self-auto`}>
                {getStatusConfig(selectedOrder.status).label}
              </span>
            </div>

            <div className="text-base text-base-content/60 mb-6">
              <p>Created: {formatDate(selectedOrder.created_at)}</p>
              {selectedOrder.paid_at && (
                <p className="text-success">Paid: {formatDate(selectedOrder.paid_at)}</p>
              )}
            </div>

            <div className="divider text-lg font-semibold">Order Items</div>

            <div className="space-y-3 mb-6">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-base-200 rounded-xl">
                  <div>
                    <p className="font-semibold text-lg">{item.item_name}</p>
                    <p className="text-base text-base-content/60">
                      {formatCurrency(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-xl">{formatCurrency(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="divider"></div>

            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                </div>
              )}
              {selectedOrder.sst_amount > 0 && (
                <div className="flex justify-between">
                  <span>SST</span>
                  <span>{formatCurrency(selectedOrder.sst_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-2xl pt-3 border-t border-base-300">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
              {selectedOrder.status === 'COMPLETED' && selectedOrder.payment_received && (
                <div className="pt-3 space-y-2">
                  <div className="flex justify-between text-base">
                    <span>Payment ({selectedOrder.payment_method})</span>
                    <span>{formatCurrency(selectedOrder.payment_received)}</span>
                  </div>
                  <div className="flex justify-between text-success font-semibold text-lg">
                    <span>Change Given</span>
                    <span>{formatCurrency(selectedOrder.change_given || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action flex-col sm:flex-row gap-3 mt-8">
              {selectedOrder.status === 'IN_PROGRESS' && (
                <>
                  <button
                    className="btn btn-lg btn-error btn-outline flex-1"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'CANCELLED')}
                    disabled={processing}
                  >
                    <XCircle size={22} /> Cancel Order
                  </button>
                  <button
                    className="btn btn-lg btn-info flex-1"
                    onClick={() => updateOrderStatus(selectedOrder.id, 'READY')}
                    disabled={processing}
                  >
                    {processing ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <>
                        <ChefHat size={22} /> Mark Ready
                      </>
                    )}
                  </button>
                </>
              )}
              {selectedOrder.status === 'READY' && (
                <button
                  className="btn btn-lg btn-success flex-1 w-full"
                  onClick={openPaymentModal}
                  disabled={processing}
                >
                  <CreditCard size={22} /> Process Payment
                </button>
              )}
              {selectedOrder.status === 'COMPLETED' && (
                <button className="btn btn-lg btn-outline flex-1 w-full">
                  <Printer size={22} /> Print Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg w-[95vw]">
            <button
              className="btn btn-circle btn-ghost absolute right-4 top-4"
              onClick={() => setShowPaymentModal(false)}
            >
              <X size={24} />
            </button>

            <h3 className="font-bold text-2xl mb-6 pr-12">
              Payment for Order #{selectedOrder.order_number}
            </h3>

            <div className="amount-display mb-6 text-center">
              <p className="text-base text-base-content/60 mb-1">Amount Due</p>
              <p className="text-4xl md:text-5xl font-bold text-primary">
                {formatCurrency(selectedOrder.total_amount)}
              </p>
            </div>

            <div className="space-y-5">
              {/* Payment method selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`btn btn-lg h-20 ${paymentMethod === 'cash' ? 'btn-info' : 'btn-outline'}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote size={28} />
                  <span className="text-lg">Cash</span>
                </button>
                <button
                  className={`btn btn-lg h-20 ${paymentMethod === 'card' ? 'btn-info' : 'btn-outline'}`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard size={28} />
                  <span className="text-lg">Card</span>
                </button>
              </div>

              {paymentMethod === 'cash' && (
                <>
                  {/* Quick payment amounts */}
                  <div className="grid grid-cols-5 gap-2">
                    {quickPaymentAmounts.map((amount) => (
                      <button
                        key={amount}
                        className="btn btn-outline quick-pay-btn"
                        onClick={() => setPaymentReceived(amount.toString())}
                      >
                        RM{amount}
                      </button>
                    ))}
                    <button
                      className="btn btn-secondary quick-pay-btn"
                      onClick={() => setPaymentReceived(selectedOrder.total_amount.toString())}
                    >
                      Exact
                    </button>
                  </div>

                  {/* Payment input */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-lg">Payment Received</span>
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      className="input input-bordered input-lg text-center text-2xl h-16"
                      value={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.value)}
                    />
                  </div>

                  {/* Change display */}
                  {payment >= selectedOrder.total_amount && (
                    <div className="alert alert-success py-4">
                      <CheckCircle size={28} />
                      <div>
                        <p className="text-sm">Change to give</p>
                        <span className="font-bold text-2xl">{formatCurrency(change)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {paymentMethod === 'card' && (
                <div className="alert alert-info py-4">
                  <CreditCard size={24} />
                  <span className="text-lg">Process card payment on terminal</span>
                </div>
              )}
            </div>

            <div className="modal-action mt-8 gap-3">
              <button
                className="btn btn-lg btn-outline flex-1"
                onClick={() => setShowPaymentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-lg btn-success flex-1"
                onClick={processPayment}
                disabled={processing || (paymentMethod === 'cash' && payment < selectedOrder.total_amount)}
              >
                {processing ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  <>
                    <CheckCircle size={22} /> Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
