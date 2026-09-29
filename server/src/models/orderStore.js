/**
 * Authoritative Order Store (Server-side ground truth)
 * Contains canonical order records for NOVA MART.
 */

const AUTHORITATIVE_ORDERS = [
  {
    orderId: 'NM-10001',
    customerId: 'CUST-1',
    customerName: 'Test Customer',
    items: [
      {
        productId: 'p4',
        productName: 'NovaWatch Fit',
        quantity: 1,
        unitPrice: 199.50,
        totalPrice: 199.50
      }
    ],
    totalAmount: 199.50,
    orderDate: '2026-09-20 14:20:00',
    status: 'DELIVERED',
    confirmation: { status: 'APPROVED', approvedBy: 'admin', approvedAt: '2026-09-20 14:30:00' },
    processing: { startedAt: '2026-09-20 15:00:00', approvedBy: 'admin' },
    shipping: { carrier: 'BlueDart', trackingNumber: 'BD-10001099', shippedAt: '2026-09-21 09:00:00' },
    delivery: { 
      estimatedDate: '2026-09-24', 
      outForDeliveryAt: '2026-09-24 10:00:00', 
      deliveredAt: '2026-09-24 16:45:00' 
    },
    cancellation: { requested: false, requestedAt: null, reason: null, status: null, processedBy: null, processedAt: null },
    return: { 
      requested: true, 
      requestedAt: '2026-09-28 11:00:00', 
      reason: 'Screen flickering issue', 
      resolution: 'REFUND', 
      status: 'PENDING', 
      processedBy: null, 
      processedAt: null 
    },
    refund: { status: 'PENDING', amount: 199.50, processedAt: null, processedBy: null },
    replacement: { requested: false, status: null, processedAt: null, processedBy: null },
    trackingEvents: [
      { date: '2026-09-20 14:20:00', event: 'Order placed' },
      { date: '2026-09-20 14:30:00', event: 'Order confirmed by Admin' },
      { date: '2026-09-21 09:00:00', event: 'Package shipped via BlueDart (Tracking # BD-10001099)' },
      { date: '2026-09-24 16:45:00', event: 'Delivered to recipient' },
      { date: '2026-09-28 11:00:00', event: 'Return requested (Reason: Screen flickering issue, Resolution: REFUND, Status: PENDING)' }
    ]
  },
  {
    orderId: 'NM-8472',
    customerId: 'CUST-1',
    customerName: 'Test Customer',
    items: [
      {
        productId: 'p2',
        productName: 'NovaBook Pro 15',
        quantity: 1,
        unitPrice: 1499.00,
        totalPrice: 1499.00
      }
    ],
    totalAmount: 1499.00,
    orderDate: '2026-09-26 10:30:00',
    status: 'SHIPPED',
    confirmation: { status: 'APPROVED', approvedBy: 'admin', approvedAt: '2026-09-26 10:45:00' },
    processing: { startedAt: '2026-09-26 11:15:00', approvedBy: 'admin' },
    shipping: { carrier: 'FedEx', trackingNumber: 'FX-84729102', shippedAt: '2026-09-27 08:30:00' },
    delivery: { 
      estimatedDate: '2026-09-30', 
      outForDeliveryAt: null, 
      deliveredAt: null 
    },
    cancellation: { requested: false, requestedAt: null, reason: null, status: null, processedBy: null, processedAt: null },
    return: { requested: false, requestedAt: null, reason: null, resolution: null, status: null, processedBy: null, processedAt: null },
    refund: { status: null, amount: null, processedAt: null, processedBy: null },
    replacement: { requested: false, status: null, processedAt: null, processedBy: null },
    trackingEvents: [
      { date: '2026-09-26 10:30:00', event: 'Order placed' },
      { date: '2026-09-26 10:45:00', event: 'Order confirmed by Admin' },
      { date: '2026-09-26 11:15:00', event: 'Order processing in warehouse' },
      { date: '2026-09-27 08:30:00', event: 'Package shipped via FedEx (Tracking # FX-84729102)' }
    ]
  }
];

module.exports = {
  AUTHORITATIVE_ORDERS
};
