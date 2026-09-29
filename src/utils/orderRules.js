export const canRequestCancellation = (order) => {
  // Only allowed if not already requested, and status is ORDER_PLACED, CONFIRMED, or PROCESSING
  if (order.cancellation?.requested) return false;
  return ['ORDER_PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status);
};

export const canRequestReturn = (order) => {
  if (order.status !== 'DELIVERED') return false;
  if (order.return?.requested) return false; 
  return true;
};

// --- Customer Actions ---

export const requestCancellation = (order, reason = "Customer requested cancellation") => {
  if (!canRequestCancellation(order)) throw new Error("Order cannot be cancelled in its current state.");
  const date = new Date().toLocaleString();
  return {
    ...order,
    cancellation: {
      ...order.cancellation,
      requested: true,
      requestedAt: date,
      reason,
      status: 'PENDING'
    },
    trackingEvents: [
      ...order.trackingEvents,
      { date, event: "Cancellation requested" }
    ]
  };
};

export const requestReturn = (order, reason, resolution) => {
  if (!canRequestReturn(order)) throw new Error("Order is not eligible for return.");
  const date = new Date().toLocaleString();
  
  return {
    ...order,
    return: {
      ...order.return,
      requested: true,
      requestedAt: date,
      reason,
      resolution,
      status: 'PENDING'
    },
    trackingEvents: [
      ...order.trackingEvents,
      { date, event: `Return requested (${resolution})` }
    ]
  };
};

// --- Admin Actions ---

export const adminConfirmOrder = (order) => {
  if (order.status !== 'ORDER_PLACED') throw new Error("Order not in PLACED state");
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'CONFIRMED',
    confirmation: { status: 'APPROVED', approvedBy: 'admin', approvedAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: "Order confirmed" }]
  };
};

export const adminStartProcessing = (order) => {
  if (order.status !== 'CONFIRMED') throw new Error("Order not CONFIRMED");
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'PROCESSING',
    processing: { startedAt: date, approvedBy: 'admin' },
    trackingEvents: [...order.trackingEvents, { date, event: "Processing order" }]
  };
};

export const adminShipOrder = (order, carrier, trackingNumber) => {
  if (order.status !== 'PROCESSING') throw new Error("Order not PROCESSING");
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'SHIPPED',
    shipping: { carrier, trackingNumber, shippedAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: `Package shipped via ${carrier} (${trackingNumber})` }]
  };
};

export const adminOutForDelivery = (order) => {
  if (order.status !== 'SHIPPED') throw new Error("Order not SHIPPED");
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'OUT_FOR_DELIVERY',
    delivery: { ...order.delivery, outForDeliveryAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: "Out for delivery" }]
  };
};

export const adminDeliverOrder = (order) => {
  if (order.status !== 'OUT_FOR_DELIVERY') throw new Error("Order not OUT_FOR_DELIVERY");
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'DELIVERED',
    delivery: { ...order.delivery, deliveredAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: "Delivered" }]
  };
};

export const adminApproveCancellation = (order) => {
  const date = new Date().toLocaleString();
  return {
    ...order,
    status: 'CANCELLED',
    cancellation: { ...order.cancellation, status: 'APPROVED', processedBy: 'admin', processedAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: "Cancellation approved" }]
  };
};

export const adminRejectCancellation = (order) => {
  const date = new Date().toLocaleString();
  return {
    ...order,
    cancellation: { ...order.cancellation, status: 'REJECTED', processedBy: 'admin', processedAt: date, requested: false },
    trackingEvents: [...order.trackingEvents, { date, event: "Cancellation rejected" }]
  };
};

export const adminApproveReturn = (order) => {
  const date = new Date().toLocaleString();
  const nextOrder = {
    ...order,
    return: { ...order.return, status: 'APPROVED', processedBy: 'admin', processedAt: date },
    trackingEvents: [...order.trackingEvents, { date, event: "Return approved" }]
  };

  if (order.return.resolution === 'REFUND') {
    nextOrder.refund = { ...nextOrder.refund, status: 'PENDING' };
  } else if (order.return.resolution === 'REPLACEMENT') {
    nextOrder.replacement = { ...nextOrder.replacement, status: 'REPLACEMENT_APPROVED' };
  }
  return nextOrder;
};

export const adminRejectReturn = (order) => {
  const date = new Date().toLocaleString();
  return {
    ...order,
    return: { ...order.return, status: 'REJECTED', processedBy: 'admin', processedAt: date, requested: false },
    trackingEvents: [...order.trackingEvents, { date, event: "Return rejected" }]
  };
};

export const adminProcessRefund = (order, nextStatus) => {
  const date = new Date().toLocaleString();
  return {
    ...order,
    refund: { ...order.refund, status: nextStatus, processedAt: date, processedBy: 'admin', amount: order.totalAmount },
    trackingEvents: [...order.trackingEvents, { date, event: `Refund status: ${nextStatus}` }]
  };
};

export const adminProcessReplacement = (order, nextStatus) => {
  const date = new Date().toLocaleString();
  return {
    ...order,
    replacement: { ...order.replacement, status: nextStatus, processedAt: date, processedBy: 'admin' },
    trackingEvents: [...order.trackingEvents, { date, event: `Replacement status: ${nextStatus}` }]
  };
};
