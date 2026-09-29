import React, { useState } from 'react';
import { 
  Package, XCircle, RefreshCcw, Box, ChevronDown, ChevronUp, 
  Clock, CheckCircle, ShoppingBag, Trash2, Plus, MessageSquare,
  Truck, ArrowRight, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { canRequestCancellation, canRequestReturn, requestCancellation, requestReturn } from './utils/orderRules';
import { INITIAL_ORDERS } from './mockData';

const Orders = ({ orders, setOrders, onNavigateToStore, onNavigateToChat }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [returnState, setReturnState] = useState({});

  // Defensively normalize orders to guarantee required fields exist
  const safeOrders = (orders || []).map(o => ({
    ...o,
    cancellation: o.cancellation || { requested: false, status: null },
    return: o.return || { requested: false, status: null },
    refund: o.refund || { status: null },
    replacement: o.replacement || { status: null },
    trackingEvents: o.trackingEvents || [],
    items: o.items || []
  }));

  if (safeOrders.length === 0) {
    return (
      <div style={{ 
        padding: '80px 24px', 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        color: 'var(--text-muted)' 
      }}>
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '24px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)'
        }}>
          <Package size={40} color="#818cf8" />
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
          No orders yet
        </h3>
        <p style={{ maxWidth: '440px', margin: '0 auto 28px', lineHeight: '1.6', fontSize: '15px' }}>
          Your order history is currently empty. Explore our eKart tech store to discover the latest electronics with fast delivery and 24/7 AI support!
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onNavigateToStore && (
            <button 
              onClick={onNavigateToStore}
              style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
                padding: '12px 26px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <ShoppingBag size={18} /> Browse eKart Store
            </button>
          )}
          <button 
            onClick={() => setOrders(INITIAL_ORDERS)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-light)',
              padding: '12px 22px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Load Sample Orders (Demo)
          </button>
        </div>
      </div>
    );
  }

  const updateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
  };

  const handleCancel = (order) => {
    if (window.confirm(`Are you sure you want to request cancellation for order #${order.orderId}?`)) {
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
      alert("Please select both a reason and preferred resolution.");
      return;
    }
    if (window.confirm(`Submit ${state.resolution.toLowerCase()} request for #${order.orderId}?`)) {
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

  const getStatusBadge = (order) => {
    if (order.refund?.status === 'COMPLETED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <CheckCircle size={14} /> REFUND COMPLETED
        </span>
      );
    }
    if (order.replacement?.status === 'REPLACEMENT_COMPLETED') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 600
        }}>
          <CheckCircle size={14} /> REPLACEMENT COMPLETED
        </span>
      );
    }

    const configs = {
      ORDER_PLACED: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' },
      CONFIRMED: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
      PROCESSING: { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' },
      SHIPPED: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' },
      OUT_FOR_DELIVERY: { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' },
      DELIVERED: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
      CANCELLED: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
    };

    const cfg = configs[order.status] || { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.text }} />
        {order.status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div style={{ 
      padding: '32px 36px', 
      height: '100%', 
      overflowY: 'auto',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.04), transparent 30%), var(--bg-base)'
    }}>
      {/* Top Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px', 
        flexWrap: 'wrap', 
        gap: '16px' 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: 'var(--text-main)' }}>
              My Orders
            </h2>
            <span style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              {safeOrders.length} {safeOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Track live package shipping status, initiate returns, or talk to customer support
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onNavigateToStore && (
            <button 
              onClick={onNavigateToStore}
              style={{
                background: 'var(--accent-gradient)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(99, 102, 241, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} /> Place New Order
            </button>
          )}
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all orders? This will delete all current orders.')) {
                setOrders([]);
              }
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              padding: '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {safeOrders.map(order => {
          const isExpanded = expandedOrder === order.orderId;
          const rState = returnState[order.orderId] || { active: false, reason: '', resolution: '' };
          const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

          return (
            <div 
              key={order.orderId} 
              style={{ 
                background: 'rgba(19, 20, 31, 0.7)', 
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)', 
                borderRadius: '18px', 
                padding: '24px 28px',
                transition: 'all 0.25s ease',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
              }}
            >
              {/* Order Card Top Bar */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
                paddingBottom: '16px', 
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.25)'
                  }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '16px', color: '#f8fafc' }}>
                        #{order.orderId}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>•</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Placed on {order.orderDate}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      Estimated Delivery: <strong style={{ color: '#cbd5e1' }}>{order.delivery?.estimatedDate || order.estimatedDeliveryDate || '3-5 business days'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  {getStatusBadge(order)}

                  {/* Secondary Return/Refund Status */}
                  {order.return?.requested && order.refund?.status !== 'COMPLETED' && order.replacement?.status !== 'REPLACEMENT_COMPLETED' && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#fbbf24', 
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      marginTop: '4px'
                    }}>
                      {order.refund?.status ? `REFUND: ${order.refund.status}` : 
                       order.replacement?.status ? `REPLACEMENT: ${order.replacement.status}` : 
                       `RETURN: ${order.return.status}`}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Product Info & Price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 600, color: 'var(--text-main)' }}>
                    {firstItem?.productName || order.productName}
                  </h3>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', display: 'flex', gap: '12px' }}>
                    <span>Quantity: <strong style={{ color: '#cbd5e1' }}>{firstItem?.quantity || order.quantity}</strong></span>
                    <span>•</span>
                    <span>Price: <strong style={{ color: '#cbd5e1' }}>${(firstItem?.unitPrice || order.unitPrice || order.price || 0).toFixed(2)}</strong></span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Amount</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8' }}>
                    ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {onNavigateToChat && (
                    <button
                      onClick={() => onNavigateToChat(order.orderId)}
                      style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease'
                      }}
                      title="Ask AI Support about this order"
                    >
                      <MessageSquare size={15} /> Support Chat
                    </button>
                  )}
                  {canRequestCancellation(order) && (
                    <button 
                      onClick={() => handleCancel(order)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '8px 14px', 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)', 
                        color: '#f87171', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      <XCircle size={15} /> Cancel Order
                    </button>
                  )}
                  {canRequestReturn(order) && !rState.active && (
                    <button 
                      onClick={() => setReturnState(prev => ({...prev, [order.orderId]: { active: true, reason: '', resolution: '' }}))}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        padding: '8px 14px', 
                        background: 'rgba(245, 158, 11, 0.08)', 
                        border: '1px solid rgba(245, 158, 11, 0.3)', 
                        color: '#fbbf24', 
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      <RefreshCcw size={15} /> Request Return
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => setExpandedOrder(isExpanded ? null : order.orderId)}
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.04)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    color: 'var(--text-main)', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} 
                  {isExpanded ? 'Hide Details' : 'Tracking & Details'}
                </button>
              </div>

              {/* Expanded Details Section */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '18px', paddingTop: '20px' }}>
                  {/* Delivery & Shipping Info Cards */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '14px', 
                    fontSize: '13px', 
                    marginBottom: '24px' 
                  }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Order Date</div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.orderDate}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Estimated Delivery</div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.delivery?.estimatedDate || order.estimatedDeliveryDate || 'In Transit'}</div>
                    </div>
                    {order.shipping?.carrier && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Carrier Partner</div>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{order.shipping.carrier}</div>
                      </div>
                    )}
                    {order.shipping?.trackingNumber && (
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Tracking Number</div>
                        <div style={{ fontWeight: 600, color: '#818cf8', fontFamily: 'monospace' }}>{order.shipping.trackingNumber}</div>
                      </div>
                    )}
                  </div>

                  {/* Status Timeline Stepper */}
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                    Live Status Progress
                  </h4>
                  <div style={{ 
                    background: 'rgba(10, 10, 15, 0.6)', 
                    padding: '24px 20px', 
                    borderRadius: '14px', 
                    marginBottom: '24px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    {['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((stage, idx, arr) => {
                      const stages = ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                      const currentIndex = stages.indexOf(order.status);
                      const isCompleted = currentIndex >= idx;
                      const isCurrent = currentIndex === idx;
                      const isCancelled = order.status === 'CANCELLED';
                      
                      let nodeColor = '#334155';
                      if (isCompleted && !isCancelled) nodeColor = '#10b981';
                      if (isCurrent && !isCancelled) nodeColor = '#6366f1';
                      if (isCancelled && isCurrent) nodeColor = '#ef4444';

                      return (
                        <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 }}>
                          {idx !== 0 && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '14px', 
                              left: '-50%', 
                              width: '100%', 
                              height: '3px', 
                              background: isCompleted ? '#10b981' : '#1e293b', 
                              zIndex: 0 
                            }} />
                          )}
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            background: nodeColor, 
                            zIndex: 1, 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            color: '#fff',
                            boxShadow: isCurrent ? `0 0 14px ${nodeColor}` : 'none'
                          }}>
                            {isCompleted && !isCurrent ? <CheckCircle size={15} /> : (isCurrent ? <span style={{width: 8, height: 8, borderRadius: '50%', background: '#fff'}} /> : null)}
                          </div>
                          <div style={{ 
                            fontSize: '11px', 
                            marginTop: '10px', 
                            color: isCompleted ? '#f8fafc' : 'var(--text-muted)', 
                            textAlign: 'center', 
                            fontWeight: isCurrent ? 700 : 500,
                            maxWidth: '75px',
                            lineHeight: '1.2'
                          }}>
                            {stage.replace(/_/g, ' ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tracking Log */}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
                    Tracking History
                  </h4>
                  <div style={{ 
                    background: 'rgba(10, 10, 15, 0.5)', 
                    padding: '16px 20px', 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {(order.trackingEvents || []).map((evt, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        gap: '14px', 
                        padding: '8px 0',
                        borderBottom: idx === (order.trackingEvents || []).length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)'
                      }}>
                        <div style={{ minWidth: '150px', color: 'var(--text-muted)', fontSize: '12px' }}>{evt.date}</div>
                        <div style={{ fontSize: '13px', color: '#e2e8f0' }}>{evt.event}</div>
                      </div>
                    ))}
                  </div>

                  {/* Return Request Box */}
                  {order.return?.requested && (
                     <div style={{ 
                       background: 'rgba(245, 158, 11, 0.08)', 
                       padding: '16px 20px', 
                       borderRadius: '12px', 
                       marginBottom: '20px', 
                       border: '1px solid rgba(245, 158, 11, 0.3)' 
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
                          <AlertTriangle size={18} /> Return Status: {order.return.status || 'PENDING'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginTop: '12px', color: '#cbd5e1' }}>
                          <div><span style={{color: 'var(--text-muted)'}}>Reason:</span> {order.return.reason}</div>
                          <div><span style={{color: 'var(--text-muted)'}}>Resolution:</span> {order.return.resolution}</div>
                          {order.refund?.status && <div><span style={{color: 'var(--text-muted)'}}>Refund Status:</span> <strong style={{color: '#a78bfa'}}>{order.refund.status.replace(/_/g, ' ')}</strong></div>}
                          {order.replacement?.status && <div><span style={{color: 'var(--text-muted)'}}>Replacement:</span> <strong style={{color: '#34d399'}}>{order.replacement.status.replace(/_/g, ' ')}</strong></div>}
                        </div>
                     </div>
                  )}

                  {/* Cancellation Box */}
                  {order.cancellation?.requested && order.status !== 'CANCELLED' && (
                     <div style={{ 
                       background: 'rgba(239, 68, 68, 0.08)', 
                       padding: '16px 20px', 
                       borderRadius: '12px', 
                       marginBottom: '20px', 
                       border: '1px solid rgba(239, 68, 68, 0.3)', 
                       color: '#fca5a5' 
                     }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: '#f87171' }}>
                          <XCircle size={18} /> Cancellation Requested (Pending Admin Review)
                        </div>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>
                          Reason: {order.cancellation.reason || 'Requested by customer'}
                        </p>
                     </div>
                  )}

                  {/* Return Submission Form */}
                  {rState.active && (
                    <div style={{ 
                      background: 'rgba(10, 10, 15, 0.7)', 
                      padding: '20px', 
                      borderRadius: '14px', 
                      marginBottom: '20px', 
                      border: '1px solid rgba(245, 158, 11, 0.4)' 
                    }}>
                      <h4 style={{ margin: '0 0 14px 0', color: '#fbbf24', fontSize: '15px', fontWeight: 600 }}>
                        Initiate Return / Replacement Request
                      </h4>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '6px', color: 'var(--text-muted)' }}>Return Reason:</label>
                        <select 
                          value={rState.reason}
                          onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], reason: e.target.value }}))}
                          style={{ 
                            width: '100%', 
                            padding: '10px 14px', 
                            borderRadius: '8px', 
                            background: 'var(--bg-panel)', 
                            color: 'var(--text-main)', 
                            border: '1px solid var(--border-light)',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        >
                          <option value="">Select a reason...</option>
                          <option value="Damaged">Damaged or defective item</option>
                          <option value="Wrong product">Wrong product delivered</option>
                          <option value="Missing item">Missing item or parts</option>
                          <option value="Product not as expected">Product not as expected</option>
                          <option value="Other">Other reason</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>Preferred Resolution:</label>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input 
                              type="radio" 
                              name={`res-${order.orderId}`} 
                              value="REFUND" 
                              onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], resolution: e.target.value }}))} 
                            /> 
                            Full Refund to original payment method
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                            <input 
                              type="radio" 
                              name={`res-${order.orderId}`} 
                              value="REPLACEMENT" 
                              onChange={(e) => setReturnState(prev => ({...prev, [order.orderId]: { ...prev[order.orderId], resolution: e.target.value }}))} 
                            /> 
                            Free Replacement unit
                          </label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setReturnState(prev => { const n = {...prev}; delete n[order.orderId]; return n; })} 
                          style={{ 
                            padding: '8px 16px', 
                            background: 'transparent', 
                            border: '1px solid var(--border-light)', 
                            color: 'var(--text-muted)', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => submitReturn(order)} 
                          style={{ 
                            padding: '8px 18px', 
                            background: '#fbbf24', 
                            border: 'none', 
                            color: '#000', 
                            fontWeight: 700, 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Submit Request
                        </button>
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
