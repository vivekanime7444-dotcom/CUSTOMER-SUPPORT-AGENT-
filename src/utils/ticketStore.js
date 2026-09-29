// Support Ticket Management Store for Human Escalations & Customer Service Handover

const INITIAL_TICKETS = [
  {
    id: "TICK-7821",
    customerId: "CUST-1",
    customerName: "Alex Morgan",
    customerEmail: "customer@vmart.com",
    orderId: "NM-10001",
    subject: "Urgent: Refund Request for Damaged Item",
    message: "The AI agent asked me to wait for return processing, but I need an immediate supervisor approval for a refund on order NM-10001 because the display was cracked on delivery.",
    status: "PENDING", // PENDING, IN_PROGRESS, RESOLVED
    priority: "HIGH",
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toLocaleString(),
    adminReply: null,
    adminRepliedAt: null,
    adminNotes: "Customer sent photo of cracked packaging via email.",
    deliveredToChat: false,
    transcript: [
      { sender: "customer", text: "My NovaPhone X arrived with a cracked screen." },
      { sender: "agent", text: "You can initiate a return in the My Orders tab." },
      { sender: "customer", text: "I need human customer support to approve an instant refund." }
    ]
  },
  {
    id: "TICK-7822",
    customerId: "CUST-2",
    customerName: "Sarah Connor",
    customerEmail: "sarah@example.com",
    orderId: "NM-10002",
    subject: "Delivery Address Correction Before Dispatch",
    message: "I moved to Apt 4B. The AI could not modify the address on an already confirmed order. Please help before it ships.",
    status: "PENDING",
    priority: "MEDIUM",
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toLocaleString(),
    adminReply: null,
    adminRepliedAt: null,
    adminNotes: "",
    deliveredToChat: false,
    transcript: [
      { sender: "customer", text: "Can you change the shipping address for NM-10002?" },
      { sender: "agent", text: "Order is already confirmed and being processed." },
      { sender: "customer", text: "Please connect me to human support." }
    ]
  }
];

export const getTickets = () => {
  try {
    const saved = localStorage.getItem('vmart_support_tickets');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading support tickets:", e);
  }
  return INITIAL_TICKETS;
};

export const saveTickets = (tickets) => {
  try {
    localStorage.setItem('vmart_support_tickets', JSON.stringify(tickets));
    // Dispatch custom event so cross-component listeners update immediately
    window.dispatchEvent(new Event('vmart_tickets_updated'));
  } catch (e) {
    console.error("Error saving support tickets:", e);
  }
};

export const createTicket = (ticketData) => {
  const tickets = getTickets();
  const newTicket = {
    id: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "PENDING",
    priority: "HIGH",
    createdAt: new Date().toLocaleString(),
    adminReply: null,
    adminRepliedAt: null,
    adminNotes: "",
    deliveredToChat: false,
    ...ticketData
  };
  const updated = [newTicket, ...tickets];
  saveTickets(updated);
  return newTicket;
};

export const updateTicket = (ticketId, updates) => {
  const tickets = getTickets();
  const updated = tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t);
  saveTickets(updated);
  return updated.find(t => t.id === ticketId);
};

export const resolveTicket = (ticketId, adminReply, adminNotes = "") => {
  return updateTicket(ticketId, {
    status: "RESOLVED",
    adminReply: adminReply,
    adminRepliedAt: new Date().toLocaleString(),
    adminNotes: adminNotes,
    deliveredToChat: false // Flag to deliver to customer's chat
  });
};

export const getCustomerTickets = (customerId) => {
  const tickets = getTickets();
  return tickets.filter(t => t.customerId === customerId);
};

export const getUndeliveredAdminReplies = (customerId) => {
  const tickets = getTickets();
  return tickets.filter(t => t.customerId === customerId && t.adminReply && !t.deliveredToChat);
};

export const markRepliesDelivered = (customerId) => {
  const tickets = getTickets();
  let modified = false;
  const updated = tickets.map(t => {
    if (t.customerId === customerId && t.adminReply && !t.deliveredToChat) {
      modified = true;
      return { ...t, deliveredToChat: true };
    }
    return t;
  });
  if (modified) {
    saveTickets(updated);
  }
};
