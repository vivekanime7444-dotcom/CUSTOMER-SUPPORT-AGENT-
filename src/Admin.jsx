import React, { useState } from 'react';
import { 
  adminConfirmOrder, adminStartProcessing, adminShipOrder, 
  adminOutForDelivery, adminDeliverOrder,
  adminApproveCancellation, adminRejectCancellation,
  adminApproveReturn, adminRejectReturn,
  adminProcessRefund, adminProcessReplacement
} from './utils/orderRules';

const Admin = ({ orders, setOrders }) => {
  const [shippingForm, setShippingForm] = useState({});

  const updateOrder = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.orderId === updatedOrder.orderId ? updatedOrder : o));
  };

  const handleAction = (actionFn, order, ...args) => {
    try {
      const updated = actionFn(order, ...args);
      updateOrder(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const summary = {
    total: orders.length,
    new: orders.filter(o => o.status === 'ORDER_PLACED').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    shipped: orders.filter(o => o.status === 'SHIPPED').length,
    cancellations: orders.filter(o => o.cancellation?.requested && o.cancellation?.status === 'PENDING').length,
    returns: orders.filter(o => o.return?.requested && o.return?.status === 'PENDING').length,
  };

  return (
    <div style={{ padding: '30px', height: '100%', overflowY: 'auto', background: '#0f172a', color: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#38bdf8' }}>Admin Order Management</h2>
        <div style={{ background: '#0ea5e920', color: '#38bdf8', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>DEVELOPMENT MODE</div>
      </div>
      
      {/* Dashboard Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '40px' }}>
        {[
          { label: 'Total Orders', val: summary.total, color: '#94a3b8' },
          { label: 'New (Placed)', val: summary.new, color: '#fbbf24' },
          { label: 'Processing', val: summary.processing, color: '#eab308' },
          { label: 'Shipped', val: summary.shipped, color: '#8b5cf6' },
          { label: 'Pending Cancels', val: summary.cancellations, color: '#f87171' },
          { label: 'Pending Returns', val: summary.returns, color: '#fb923c' }
        ].map(s => (
          <div key={s.label} style={{ background: '#1e293b', border: `1px solid ${s.color}40`, padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{s.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      <h3>Order Queue</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {orders.length === 0 && <p style={{ color: '#64748b' }}>No orders in the system.</p>}
        {orders.map(order => (
          <div key={order.orderId} style={{ background: '#1e293b', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e2e8f0', marginRight: '16px' }}>{order.orderId}</span>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>{order.customerName} ({order.customerId})</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#38bdf8' }}>
                  {order.refund?.status === 'COMPLETED' ? 'REFUND COMPLETED' 
                   : order.replacement?.status === 'REPLACEMENT_COMPLETED' ? 'REPLACEMENT COMPLETED'
                   : order.status.replace(/_/g, ' ')}
                </div>
                {order.return?.requested && order.refund?.status !== 'COMPLETED' && order.replacement?.status !== 'REPLACEMENT_COMPLETED' && (
                  <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', fontWeight: 'bold' }}>
                    {order.refund?.status ? `REFUND: ${order.refund.status}` : 
                     order.replacement?.status ? `REPLACEMENT: ${order.replacement.status}` : 
                     `RETURN: ${order.return.status}`}
                  </div>
                )}
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '20px' }}>
              <div>Products: {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || order.productName}</div>
              <div>Total: ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}</div>
              <div>Date: {order.orderDate}</div>
            </div>

            {/* Admin Actions Area */}
            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginRight: '8px', width: '100%' }}>LIFECYCLE CONTROLS</span>
              
              {order.status === 'ORDER_PLACED' && (
                <button className="admin-btn" onClick={() => handleAction(adminConfirmOrder, order)}>Confirm Order</button>
              )}
              {order.status === 'CONFIRMED' && (
                <button className="admin-btn" onClick={() => handleAction(adminStartProcessing, order)}>Start Processing</button>
              )}
              {order.status === 'PROCESSING' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Carrier" className="admin-input" 
                    value={shippingForm[order.orderId]?.carrier || ''} 
                    onChange={e => setShippingForm({...shippingForm, [order.orderId]: {...shippingForm[order.orderId], carrier: e.target.value}})} 
                  />
                  <input type="text" placeholder="Tracking #" className="admin-input" 
                    value={shippingForm[order.orderId]?.tracking || ''} 
                    onChange={e => setShippingForm({...shippingForm, [order.orderId]: {...shippingForm[order.orderId], tracking: e.target.value}})} 
                  />
                  <button className="admin-btn" onClick={() => {
                    const form = shippingForm[order.orderId];
                    if (!form || !form.carrier || !form.tracking) return alert("Carrier and tracking needed");
                    handleAction(adminShipOrder, order, form.carrier, form.tracking);
                  }}>Ship Order</button>
                </div>
              )}
              {order.status === 'SHIPPED' && (
                <button className="admin-btn" onClick={() => handleAction(adminOutForDelivery, order)}>Mark Out for Delivery</button>
              )}
              {order.status === 'OUT_FOR_DELIVERY' && (
                <button className="admin-btn" onClick={() => handleAction(adminDeliverOrder, order)}>Mark Delivered</button>
              )}

              {/* Cancellation Requests */}
              {order.cancellation?.requested && order.cancellation.status === 'PENDING' && (
                <div style={{ width: '100%', background: '#451a1a', border: '1px solid #7f1d1d', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div style={{ color: '#fca5a5', marginBottom: '8px', fontSize: '14px' }}><strong>Cancellation Request:</strong> {order.cancellation.reason}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="admin-btn-danger" onClick={() => handleAction(adminApproveCancellation, order)}>Approve Cancellation</button>
                    <button className="admin-btn" onClick={() => handleAction(adminRejectCancellation, order)}>Reject</button>
                  </div>
                </div>
              )}

              {/* Return Requests */}
              {order.return?.requested && order.return.status === 'PENDING' && (
                <div style={{ width: '100%', background: '#422006', border: '1px solid #78350f', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div style={{ color: '#fcd34d', marginBottom: '8px', fontSize: '14px' }}>
                    <strong>Return Request:</strong> {order.return.reason} (Wants: {order.return.resolution})
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="admin-btn-warning" onClick={() => handleAction(adminApproveReturn, order)}>Approve Return</button>
                    <button className="admin-btn" onClick={() => handleAction(adminRejectReturn, order)}>Reject</button>
                  </div>
                </div>
              )}

              {/* Refund Flow */}
              {order.refund?.status && !['COMPLETED', 'REJECTED'].includes(order.refund.status) && (
                <div style={{ width: '100%', background: '#064e3b', border: '1px solid #065f46', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div style={{ color: '#6ee7b7', marginBottom: '8px', fontSize: '14px' }}><strong>Refund Flow:</strong> {order.refund.status}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.refund.status === 'PENDING' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'APPROVED')}>Approve Refund</button>}
                    {order.refund.status === 'APPROVED' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'PROCESSING')}>Process Refund</button>}
                    {order.refund.status === 'PROCESSING' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'COMPLETED')}>Complete Refund</button>}
                  </div>
                </div>
              )}

              {/* Replacement Flow */}
              {order.replacement?.status && !['REPLACEMENT_COMPLETED', 'REPLACEMENT_REJECTED'].includes(order.replacement.status) && (
                <div style={{ width: '100%', background: '#1e1b4b', border: '1px solid #3730a3', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                  <div style={{ color: '#a5b4fc', marginBottom: '8px', fontSize: '14px' }}><strong>Replacement Flow:</strong> {order.replacement.status}</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.replacement.status === 'REPLACEMENT_APPROVED' && <button className="admin-btn-info" onClick={() => handleAction(adminProcessReplacement, order, 'REPLACEMENT_SHIPPED')}>Ship Replacement</button>}
                    {order.replacement.status === 'REPLACEMENT_SHIPPED' && <button className="admin-btn-info" onClick={() => handleAction(adminProcessReplacement, order, 'REPLACEMENT_DELIVERED')}>Mark Delivered</button>}
                    {order.replacement.status === 'REPLACEMENT_DELIVERED' && <button className="admin-btn-info" onClick={() => handleAction(adminProcessReplacement, order, 'REPLACEMENT_COMPLETED')}>Complete Replacement</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .admin-btn { background: #334155; color: #f8fafc; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .admin-btn:hover { background: #475569; }
        .admin-btn-danger { background: #ef4444; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .admin-btn-danger:hover { background: #dc2626; }
        .admin-btn-warning { background: #f59e0b; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .admin-btn-warning:hover { background: #d97706; }
        .admin-btn-success { background: #10b981; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .admin-btn-success:hover { background: #059669; }
        .admin-btn-info { background: #6366f1; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
        .admin-btn-info:hover { background: #4f46e5; }
        .admin-input { background: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 8px; border-radius: 4px; font-size: 13px; outline: none; }
      `}</style>
    </div>
  );
};

export default Admin;
