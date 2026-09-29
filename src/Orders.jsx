import React, { useState } from 'react';
import { Package, XCircle, RefreshCcw, Box, ChevronDown, ChevronUp, Clock, CheckCircle } from 'lucide-react';
import { canRequestCancellation, canRequestReturn, requestCancellation, requestReturn } from './utils/orderRules';

const Orders = ({ orders, setOrders }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [returnState, setReturnState] = useState({});

  if (orders.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>No orders yet</h3>
        <p>Your recent orders will appear here.</p>
      </div>
    );
  }

  const updateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
  };

  const handleCancel = (order) => {
    if (window.confirm('Are you sure you want to request cancellation for this order?')) {
      try {
        const updated = requestCancellation(order);
        updateOrder(updated);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const submitReturn = (order) => {
    const state = returnState[order.orderId];
    if (!state || !state.reason || !state.resolution) {
      alert("Please select a reason and a resolution type.");
      return;
    }
    if (window.confirm(`Are you sure you want to request a ${state.resolution}?`)) {
      try {
        const updated = requestReturn(order, state.reason, state.resolution);
        updateOrder(updated);
        setReturnState(prev => {
          const next = {...prev};
          delete next[order.orderId];
          return next;
        });
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ORDER_PLACED': return '#fbbf24';
      case 'CONFIRMED': return '#3b82f6';
      case 'PROCESSING': return '#eab308';
      case 'SHIPPED': return '#8b5cf6';
      case 'OUT_FOR_DELIVERY': return '#f97316';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '30px' }}>My Orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.map(order => {
          const isExpanded = expandedOrder === order.orderId;
          const rState = returnState[order.orderId] || { active: false, reason: '', resolution: '' };
          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

          return (
            <div key={order.orderId} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>ORDER ID</div>
                  <div style={{ fontWeight: 'bold' }}>{order.orderId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>STATUS</div>
                  
                  {/* Primary Status */}
                  {order.refund?.status === 'COMPLETED' ? (
                    <div style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> REFUND COMPLETED
                    </div>
                  ) : order.replacement?.status === 'REPLACEMENT_COMPLETED' ? (
                    <div style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={16} /> REPLACEMENT COMPLETED
                    </div>
                  ) : (
                    <div style={{ fontWeight: 'bold', color: getStatusColor(order.status), display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {order.status === 'ORDER_PLACED' ? <Clock size={16} /> : <CheckCircle size={16} />}
                      {order.status.replace(/_/g, ' ')}
                    </div>
                  )}

                  {/* Secondary Return/Refund Status if active and not yet fully completed */}
                  {order.return?.requested && order.refund?.status !== 'COMPLETED' && order.replacement?.status !== 'REPLACEMENT_COMPLETED' && (
                    <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: 'bold' }}>
                      {order.refund?.status ? `REFUND: ${order.refund.status}` : 
                       order.replacement?.status ? `REPLACEMENT: ${order.replacement.status}` : 
                       `RETURN: ${order.return.status}`}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{firstItem?.productName || order.productName}</h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Qty: {firstItem?.quantity || order.quantity} × ${(firstItem?.unitPrice || order.unitPrice || order.price || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button 
                  onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                  style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', marginBottom: '24px' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Order Date:</span> {order.orderDate}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Est. Delivery:</span> {order.delivery?.estimatedDate || order.estimatedDeliveryDate}</div>
                    {order.shipping?.carrier && <div><span style={{ color: 'var(--text-muted)' }}>Carrier:</span> {order.shipping.carrier}</div>}
                    {order.shipping?.trackingNumber && <div><span style={{ color: 'var(--text-muted)' }}>Tracking:</span> {order.shipping.trackingNumber}</div>}
                  </div>

                  <h4 style={{ marginBottom: '12px' }}>Order Status Timeline</h4>
                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((stage, idx, arr) => {
                      const stages = ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                      const currentIndex = stages.indexOf(order.status);
                      const isCompleted = currentIndex >= idx;
                      const isCurrent = currentIndex === idx;
                      const isCancelled = order.status === 'CANCELLED';
                      
                      let color = '#334155'; // upcoming
                      if (isCompleted && !isCancelled) color = '#10b981'; // completed
                      if (isCurrent && !isCancelled) color = '#3b82f6'; // current
                      if (isCancelled && isCurrent) color = '#ef4444';

                      return (
                        <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 }}>
                          {idx !== 0 && (
                            <div style={{ position: 'absolute', top: '12px', left: '-50%', width: '100%', height: '2px', background: isCompleted ? '#10b981' : '#334155', zIndex: 0 }}></div>
                          )}
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                            {isCompleted && !isCurrent ? <CheckCircle size={14} /> : (isCurrent ? <span style={{width: 8, height: 8, borderRadius: '50%', background: '#fff'}} /> : null)}
                          </div>
                          <div style={{ fontSize: '11px', marginTop: '8px', color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', fontWeight: isCurrent ? 'bold' : 'normal' }}>
                            {stage.replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <h4 style={{ marginBottom: '12px' }}>Tracking Events</h4>
                  <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                    {(order.trackingEvents || []).map((evt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: idx === (order.trackingEvents || []).length - 1 ? 0 : '12px' }}>
                        <div style={{ minWidth: '140px', color: 'var(--text-muted)', fontSize: '12px' }}>{evt.date}</div>
                        <div style={{ fontSize: '14px' }}>{evt.event}</div>
                      </div>
                    ))}
                  </div>

                  {/* Return Information */}
                  {order.return?.requested && (
                     <div style={{ background: '#3b2f15', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #854d0e' }}>
                        <h4 style={{ color: '#facc15', marginBottom: '8px', margin: 0 }}>Return Request: {order.return.status || 'PENDING'}</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', marginTop: '12px' }}>
                          <div><span style={{color: '#a1a1aa'}}>Reason:</span> {order.return.reason}</div>
                          <div><span style={{color: '#a1a1aa'}}>Resolution:</span> {order.return.resolution}</div>
                          {order.refund?.status && <div><span style={{color: '#a1a1aa'}}>Refund:</span> {order.refund.status.replace(/_/g, ' ')}</div>}
                          {order.replacement?.status && <div><span style={{color: '#a1a1aa'}}>Replacement:</span> {order.replacement.status.replace(/_/g, ' ')}</div>}
                        </div>
                     </div>
                  )}

                  {/* Cancellation Pending */}
                  {order.cancellation?.requested && order.status !== 'CANCELLED' && (
                     <div style={{ background: '#451a1a', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #991b1b', color: '#fca5a5' }}>
                        <h4 style={{ margin: 0 }}>Cancellation Requested (Pending Admin Review)</h4>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Reason: {order.cancellation.reason}</p>
                     </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '24px' }}>
                    {canRequestCancellation(order) && (
                      <button 
                        onClick={() => handleCancel(order)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <XCircle size={16} /> Request Cancellation
                      </button>
                    )}
                    {canRequestReturn(order) && !rState.active && (
                      <button 
                        onClick={() => setReturnState(prev => ({...prev, [order.orderId]: { active: true, reason: '', resolution: '' }}))}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <RefreshCcw size={16} /> Request Return
                      </button>
                    )}
                  </div>

                  {/* Return Form */}
                  {rState.active && (
                    <div style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #f59e0b' }}>
                      <h4 style={{ marginBottom: '16px', color: '#f59e0b' }}>Initiate Return Request</h4>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Return Reason:</label>
                        <select 
                          value={rState.reason}
                          onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], reason: e.target.value }}))}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}
                        >
                          <option value="">Select a reason...</option>
                          <option value="Damaged">Damaged</option>
                          <option value="Wrong product">Wrong product</option>
                          <option value="Missing item">Missing item</option>
                          <option value="Product not as expected">Product not as expected</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px' }}>Preferred Resolution:</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label><input type="radio" name={`res-${order.orderId}`} value="REFUND" onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], resolution: e.target.value }}))} /> Refund</label>
                          <label><input type="radio" name={`res-${order.orderId}`} value="REPLACEMENT" onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], resolution: e.target.value }}))} /> Replacement</label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setReturnState(prev => { const n = {...prev}; delete n[order.orderId]; return n; })} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => submitReturn(order)} style={{ padding: '6px 12px', background: '#f59e0b', border: 'none', color: '#000', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>Submit Request</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
