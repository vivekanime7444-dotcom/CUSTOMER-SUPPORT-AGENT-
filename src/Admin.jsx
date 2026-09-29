import React, { useState, useEffect, useMemo } from 'react';
import { 
  adminConfirmOrder, adminStartProcessing, adminShipOrder, 
  adminOutForDelivery, adminDeliverOrder,
  adminApproveCancellation, adminRejectCancellation,
  adminApproveReturn, adminRejectReturn,
  adminProcessRefund, adminProcessReplacement
} from './utils/orderRules';
import { 
  getTickets, saveTickets, updateTicket, resolveTicket 
} from './utils/ticketStore';
import { 
  getUsers, saveUsers, addUser, updateUser, deleteUser, 
  toggleUserStatus, resetUserPassword 
} from './utils/userStore';
import { 
  getProducts, saveProducts, addProduct, updateProduct, deleteProduct 
} from './utils/productStore';
import { 
  ShieldCheck, Users, MessageSquare, Package, ShoppingBag, 
  Settings, CheckCircle, XCircle, AlertTriangle, Clock, 
  Search, Plus, Trash2, Edit3, Lock, RefreshCw, Send, 
  TrendingUp, DollarSign, Truck, AlertCircle, Eye, ArrowRight,
  Shield, CheckCircle2, ChevronRight, UserCheck, UserX, Key
} from 'lucide-react';

const Admin = ({ orders, setOrders }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tickets', 'users', 'orders', 'products', 'settings'
  
  // Stores state
  const [tickets, setTickets] = useState(getTickets);
  const [usersList, setUsersList] = useState(getUsers);
  const [productsList, setProductsList] = useState(getProducts);

  // Sub-tab / filter states
  const [ticketFilter, setTicketFilter] = useState('PENDING'); // 'ALL', 'PENDING', 'IN_PROGRESS', 'RESOLVED'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [ticketStatusSelect, setTicketStatusSelect] = useState('RESOLVED');

  // User management state
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'user', phone: '' });
  const [passwordResetUser, setPasswordResetUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Order management state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [shippingForm, setShippingForm] = useState({});

  // Product catalog state
  const [productSearch, setProductSearch] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: '', category: 'Smartphones', price: '', stock: 50, image: '', description: ''
  });

  // System settings state
  const [announcement, setAnnouncement] = useState(() => {
    return localStorage.getItem('vmart_store_announcement') || '🚀 Welcome to V MART! Free express delivery on all electronics.';
  });
  const [autoEscalate, setAutoEscalate] = useState(true);

  // Listen to cross-component updates
  useEffect(() => {
    const handleTicketsUpdated = () => setTickets(getTickets());
    const handleUsersUpdated = () => setUsersList(getUsers());
    const handleProductsUpdated = () => setProductsList(getProducts());

    window.addEventListener('vmart_tickets_updated', handleTicketsUpdated);
    window.addEventListener('vmart_users_updated', handleUsersUpdated);
    window.addEventListener('vmart_products_updated', handleProductsUpdated);

    return () => {
      window.removeEventListener('vmart_tickets_updated', handleTicketsUpdated);
      window.removeEventListener('vmart_users_updated', handleUsersUpdated);
      window.removeEventListener('vmart_products_updated', handleProductsUpdated);
    };
  }, []);

  // Update order helper
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

  // KPIs
  const summary = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0);
    const pendingTicketsCount = tickets.filter(t => t.status === 'PENDING').length;
    const pendingCancels = orders.filter(o => o.cancellation?.requested && o.cancellation?.status === 'PENDING').length;
    const pendingReturns = orders.filter(o => o.return?.requested && o.return?.status === 'PENDING').length;

    return {
      revenue: totalRev,
      totalOrders: orders.length,
      pendingTickets: pendingTicketsCount,
      activeUsers: usersList.filter(u => u.status === 'active').length,
      totalUsers: usersList.length,
      pendingActions: pendingCancels + pendingReturns,
      catalogCount: productsList.length
    };
  }, [orders, tickets, usersList, productsList]);

  // Support Ticket Resolution
  const handleResolveTicket = (e) => {
    if (e) e.preventDefault();
    if (!selectedTicket) return;
    if (!adminReplyText.trim()) {
      alert("Please provide an official resolution message for the customer.");
      return;
    }

    const updated = updateTicket(selectedTicket.id, {
      status: ticketStatusSelect,
      adminReply: adminReplyText.trim(),
      adminRepliedAt: new Date().toLocaleString(),
      adminNotes: adminNotesText.trim(),
      deliveredToChat: false
    });

    setTickets(getTickets());
    setSelectedTicket(updated);
    alert(`Resolution sent for Ticket #${selectedTicket.id}! The customer will receive this message directly in their chat session.`);
  };

  // User Actions
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      alert("Please enter Name, Email, and Password.");
      return;
    }
    addUser(newUserData);
    setUsersList(getUsers());
    setShowAddUserModal(false);
    setNewUserData({ name: '', email: '', password: '', role: 'user', phone: '' });
  };

  const handleToggleStatus = (userId) => {
    toggleUserStatus(userId);
    setUsersList(getUsers());
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'admin' && usersList.filter(u => u.role === 'admin').length <= 1) {
      alert("Cannot delete the only remaining Administrator account.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user ${user.name} (${user.email})?`)) {
      deleteUser(user.id);
      setUsersList(getUsers());
    }
  };

  const handleSavePasswordReset = () => {
    if (!newPasswordVal || newPasswordVal.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    resetUserPassword(passwordResetUser.id, newPasswordVal);
    setUsersList(getUsers());
    setPasswordResetUser(null);
    setNewPasswordVal('');
    alert("Password updated successfully.");
  };

  // Product Actions
  const handleCreateProduct = (e) => {
    e.preventDefault();
    if (!newProductData.name || !newProductData.price) {
      alert("Please enter product name and price.");
      return;
    }
    addProduct(newProductData);
    setProductsList(getProducts());
    setShowAddProductModal(false);
    setNewProductData({ name: '', category: 'Smartphones', price: '', stock: 50, image: '', description: '' });
  };

  const handleDeleteProduct = (productId, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the eKart store catalog?`)) {
      deleteProduct(productId);
      setProductsList(getProducts());
    }
  };

  const handleStockChange = (productId, newStock) => {
    updateProduct(productId, { stock: Math.max(0, parseInt(newStock) || 0) });
    setProductsList(getProducts());
  };

  // Save announcements
  const handleSaveAnnouncement = () => {
    localStorage.setItem('vmart_store_announcement', announcement);
    alert("Store announcement updated.");
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#090d16', color: '#f8fafc', overflow: 'hidden' }}>
      {/* Admin Sub-Sidebar */}
      <div style={{
        width: '260px',
        background: '#0d1322',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>Admin Console</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Master Control</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: TrendingUp },
            { 
              id: 'tickets', 
              label: 'Human Support Tickets', 
              icon: MessageSquare,
              badge: summary.pendingTickets > 0 ? summary.pendingTickets : null,
              badgeColor: '#ef4444'
            },
            { id: 'users', label: 'User Management', icon: Users, badge: summary.totalUsers },
            { 
              id: 'orders', 
              label: 'Order Lifecycle', 
              icon: Package,
              badge: summary.pendingActions > 0 ? summary.pendingActions : null,
              badgeColor: '#f59e0b'
            },
            { id: 'products', label: 'eKart Inventory', icon: ShoppingBag, badge: summary.catalogCount },
            { id: 'settings', label: 'Store & Controls', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))' : 'transparent',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  color: isActive ? '#34d399' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? '#34d399' : '#94a3b8'} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span style={{
                    background: tab.badgeColor || 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Admin Status Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#0a0e18' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#10b981' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span>Admin Status: Available</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Ready to resolve customer issues
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#090d16' }}>
        
        {/* ===================== TAB 1: OVERVIEW & KPIS ===================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  System Command Center
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Real-time visibility over users, support escalations, logistics, and eKart inventory
                </p>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={16} /> All Systems Operational
              </div>
            </div>

            {/* Top Attention Alert if pending tickets exist */}
            {summary.pendingTickets > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.05))',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '18px 24px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f87171'
                  }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#f8fafc' }}>
                      {summary.pendingTickets} Customer {summary.pendingTickets === 1 ? 'Request' : 'Requests'} Waiting for Human Support
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                      Users requested human customer support because the automated assistant could not finalize their inquiry.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('tickets'); setTicketFilter('PENDING'); }}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Review Tickets <ArrowRight size={16} />
                </button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '32px' }}>
              {[
                { label: 'Total Revenue', val: `$${summary.revenue.toFixed(2)}`, icon: DollarSign, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
                { label: 'Total Orders', val: summary.totalOrders, icon: Package, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.1)' },
                { label: 'Pending Human Tickets', val: summary.pendingTickets, icon: MessageSquare, color: summary.pendingTickets > 0 ? '#f87171' : '#10b981', bg: summary.pendingTickets > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(16, 185, 129, 0.1)' },
                { label: 'Registered Users', val: `${summary.activeUsers} / ${summary.totalUsers}`, icon: Users, color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
                { label: 'Pending Cancellations/Returns', val: summary.pendingActions, icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
                { label: 'eKart Catalog Products', val: summary.catalogCount, icon: ShoppingBag, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' }
              ].map(kpi => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} style={{
                    background: '#0d1322',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{kpi.label}</span>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                        <Icon size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: kpi.color }}>{kpi.val}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Panel */}
            <div style={{ background: '#0d1322', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Quick Administration Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setActiveTab('tickets'); setTicketFilter('PENDING'); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                >
                  <MessageSquare size={16} /> Solve Human Support Inquiries ({summary.pendingTickets})
                </button>
                <button 
                  onClick={() => { setActiveTab('users'); setShowAddUserModal(true); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}
                >
                  <Users size={16} /> Add New User / Admin
                </button>
                <button 
                  onClick={() => { setActiveTab('products'); setShowAddProductModal(true); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(129, 140, 248, 0.15)', borderColor: 'rgba(129, 140, 248, 0.4)', color: '#818cf8' }}
                >
                  <Plus size={16} /> Add New Product to eKart
                </button>
                <button 
                  onClick={() => { setActiveTab('orders'); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
                >
                  <Package size={16} /> Process Pending Orders ({summary.pendingActions})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: HUMAN SUPPORT & ESCALATION TICKETS ===================== */}
        {activeTab === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  Contact Support & Human Escalation Management
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  When AI assistant cannot solve an issue, customer requests are routed here for direct administrator resolution
                </p>
              </div>

              {/* Status Filters */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'ALL', label: 'All Tickets' },
                  { id: 'PENDING', label: `Pending Admin (${tickets.filter(t => t.status === 'PENDING').length})` },
                  { id: 'IN_PROGRESS', label: 'In Progress' },
                  { id: 'RESOLVED', label: 'Resolved' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setTicketFilter(filter.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: ticketFilter === filter.id ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                      background: ticketFilter === filter.id ? 'rgba(16, 185, 129, 0.2)' : '#0d1322',
                      color: ticketFilter === filter.id ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Tickets list on left, Resolution workspace on right */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '20px' }}>
              {/* Tickets List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tickets
                  .filter(t => ticketFilter === 'ALL' || t.status === ticketFilter)
                  .map(ticket => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    const isPending = ticket.status === 'PENDING';

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setAdminReplyText(ticket.adminReply || '');
                          setAdminNotesText(ticket.adminNotes || '');
                          setTicketStatusSelect(ticket.status === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
                        }}
                        style={{
                          background: isSelected ? '#131b2e' : '#0d1322',
                          border: '1px solid',
                          borderColor: isSelected ? '#10b981' : (isPending ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                          borderRadius: '14px',
                          padding: '18px 20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isPending ? '0 0 15px rgba(239, 68, 68, 0.08)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '14px' }}>#{ticket.id}</span>
                            {isPending && (
                              <span style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 700
                              }}>
                                NEEDS ADMIN
                              </span>
                            )}
                            <span style={{
                              background: ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: ticket.status === 'RESOLVED' ? '#34d399' : '#fbbf24',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600
                            }}>
                              {ticket.status}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{ticket.createdAt}</span>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '15px', color: '#f8fafc', marginBottom: '6px' }}>
                          {ticket.subject}
                        </div>

                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                          {ticket.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                          <div>
                            <span>User: <strong style={{ color: '#cbd5e1' }}>{ticket.customerName}</strong> ({ticket.customerId})</span>
                            {ticket.orderId && <span> • Order: <strong style={{ color: '#818cf8' }}>#{ticket.orderId}</strong></span>}
                          </div>
                          <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            {isSelected ? 'Editing Resolution' : 'Review & Solve →'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected Ticket Resolution Workspace */}
              {selectedTicket && (
                <div style={{
                  background: '#0d1322',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                          Ticket #{selectedTicket.id}
                        </span>
                        <span style={{
                          background: selectedTicket.status === 'RESOLVED' ? '#10b981' : '#f59e0b',
                          color: '#000',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {selectedTicket.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        Requested by {selectedTicket.customerName} ({selectedTicket.customerEmail})
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedTicket(null)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Close ✕
                    </button>
                  </div>

                  {/* Customer issue context */}
                  <div style={{ background: '#090d16', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '18px' }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Customer Issue Description:
                    </div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Chat snippet */}
                  {selectedTicket.transcript && selectedTicket.transcript.length > 0 && (
                    <div style={{ background: '#090d16', padding: '12px 16px', borderRadius: '10px', marginBottom: '18px', fontSize: '12px' }}>
                      <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Prior Conversation Transcript:</div>
                      {selectedTicket.transcript.map((msg, idx) => (
                        <div key={idx} style={{ marginBottom: '4px', color: msg.sender === 'customer' ? '#cbd5e1' : '#818cf8' }}>
                          <strong>{msg.sender === 'customer' ? 'Customer' : 'AI Agent'}:</strong> {msg.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Resolution Templates */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Quick Resolution Templates:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        "I have reviewed your inquiry and authorized an immediate full refund for this order.",
                        "Your delivery address has been successfully corrected. The package will ship to your updated address.",
                        "I have prioritized your replacement dispatch. A new unit will ship tomorrow with express tracking.",
                        "I have verified your account and cleared the hold on your orders."
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAdminReplyText(tmpl)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#cbd5e1',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Template {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resolution Input */}
                  <form onSubmit={handleResolveTicket}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#34d399', fontWeight: 600, marginBottom: '6px' }}>
                        Official Admin Resolution Message (Delivered Directly into User's Chat):
                      </label>
                      <textarea
                        rows={4}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Type the official administrator response to the customer..."
                        style={{
                          width: '100%',
                          background: '#090d16',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '10px',
                          color: '#f8fafc',
                          padding: '12px',
                          fontSize: '13px',
                          outline: 'none',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Ticket Status:</label>
                        <select
                          value={ticketStatusSelect}
                          onChange={(e) => setTicketStatusSelect(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#090d16',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        >
                          <option value="RESOLVED">RESOLVED (Solved by Admin)</option>
                          <option value="IN_PROGRESS">IN PROGRESS (Admin Working On It)</option>
                          <option value="PENDING">PENDING (Keep Active)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Internal Admin Notes:</label>
                        <input
                          type="text"
                          value={adminNotesText}
                          onChange={(e) => setAdminNotesText(e.target.value)}
                          placeholder="Optional notes for other admins..."
                          style={{
                            width: '100%',
                            background: '#090d16',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Send size={16} /> Submit Resolution & Notify Customer in Live Chat
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: USER MANAGEMENT ===================== */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  User & Role Management
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Control customer accounts, administrator privileges, account access, and password resets
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} /> Add New User
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0d1322',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 14px 10px 38px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  background: '#0d1322',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#f8fafc',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontSize: '13px'
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="user">Customers Only</option>
                <option value="admin">Administrators Only</option>
              </select>
            </div>

            {/* Users Table */}
            <div style={{ background: '#0d1322', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                    <th style={{ padding: '14px 20px' }}>User</th>
                    <th style={{ padding: '14px 16px' }}>Email & Phone</th>
                    <th style={{ padding: '14px 16px' }}>Role</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px' }}>Joined Date</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList
                    .filter(u => {
                      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                                            u.id.toLowerCase().includes(userSearch.toLowerCase());
                      const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                      return matchesSearch && matchesRole;
                    })
                    .map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: u.role === 'admin' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#ffffff',
                              fontSize: '13px'
                            }}>
                              {u.role === 'admin' ? <Shield size={16} /> : (u.name?.[0] || 'U')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>ID: {u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ color: '#cbd5e1' }}>{u.email}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{u.phone || 'No phone'}</div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: u.role === 'admin' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                            color: u.role === 'admin' ? '#34d399' : '#818cf8',
                            border: `1px solid ${u.role === 'admin' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}>
                            {u.role}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            background: u.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: u.status === 'active' ? '#34d399' : '#f87171',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600
                          }}>
                            {u.status === 'active' ? '● Active' : '✕ Suspended'}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', color: '#94a3b8' }}>
                          {u.joinedDate || '2026-09-01'}
                        </td>

                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                              style={{
                                background: u.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: u.status === 'active' ? '#f87171' : '#34d399',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 600
                              }}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>

                            <button
                              onClick={() => setPasswordResetUser(u)}
                              title="Reset Password"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#38bdf8',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              <Key size={13} />
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0d1322', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '16px', padding: '28px', width: '440px', maxWidth: '90%' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>Create New Account</h3>
                  <form onSubmit={handleCreateUser}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Full Name:</label>
                      <input type="text" required value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} className="admin-input-full" placeholder="e.g. Jane Doe" />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Email Address:</label>
                      <input type="email" required value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} className="admin-input-full" placeholder="e.g. jane@example.com" />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Initial Password:</label>
                      <input type="password" required value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="admin-input-full" placeholder="Minimum 6 characters" />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Account Role:</label>
                      <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})} className="admin-input-full">
                        <option value="user">Customer (Regular User)</option>
                        <option value="admin">Administrator (Full Admin Access)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddUserModal(false)} className="admin-cancel-btn">Cancel</button>
                      <button type="submit" className="admin-confirm-btn">Create Account</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Password Reset Modal */}
            {passwordResetUser && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0d1322', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '16px', padding: '24px', width: '380px', maxWidth: '90%' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#f8fafc' }}>Reset User Password</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
                    Resetting password for: <strong style={{ color: '#f8fafc' }}>{passwordResetUser.name}</strong> ({passwordResetUser.email})
                  </p>
                  <input
                    type="password"
                    placeholder="Enter new password (min 6 chars)..."
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="admin-input-full"
                    style={{ marginBottom: '16px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => setPasswordResetUser(null)} className="admin-cancel-btn">Cancel</button>
                    <button onClick={handleSavePasswordReset} className="admin-confirm-btn">Update Password</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 4: ORDER LIFECYCLE & LOGISTICS ===================== */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  Order Logistics & Lifecycle Controls
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Manage fulfillment, shipping dispatches, cancellation requests, and returns/refund approvals
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: orderStatusFilter === st ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      background: orderStatusFilter === st ? 'rgba(56, 189, 248, 0.15)' : '#0d1322',
                      color: orderStatusFilter === st ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders
                .filter(o => orderStatusFilter === 'ALL' || o.status === orderStatusFilter)
                .map(order => (
                  <div key={order.orderId} style={{ background: '#0d1322', padding: '22px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginRight: '12px' }}>#{order.orderId}</span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{order.customerName} ({order.customerId}) • {order.orderDate}</span>
                      </div>
                      <div>
                        <span style={{
                          background: order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: order.status === 'DELIVERED' ? '#34d399' : '#38bdf8',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: '#cbd5e1' }}>
                      <div>
                        Products: <strong>{order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || order.productName}</strong>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: '#38bdf8' }}>
                        ${(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Admin Action Controls */}
                    <div style={{ background: '#090d16', padding: '14px 18px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '8px' }}>LIFECYCLE CONTROLS:</span>

                      {order.status === 'ORDER_PLACED' && (
                        <button className="admin-btn-action" onClick={() => handleAction(adminConfirmOrder, order)}>Confirm Order</button>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <button className="admin-btn-action" onClick={() => handleAction(adminStartProcessing, order)}>Start Processing</button>
                      )}
                      {order.status === 'PROCESSING' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input type="text" placeholder="Carrier (e.g. FedEx)" className="admin-input-small" 
                            value={shippingForm[order.orderId]?.carrier || ''} 
                            onChange={e => setShippingForm({...shippingForm, [order.orderId]: {...shippingForm[order.orderId], carrier: e.target.value}})} 
                          />
                          <input type="text" placeholder="Tracking #" className="admin-input-small" 
                            value={shippingForm[order.orderId]?.tracking || ''} 
                            onChange={e => setShippingForm({...shippingForm, [order.orderId]: {...shippingForm[order.orderId], tracking: e.target.value}})} 
                          />
                          <button className="admin-btn-action" onClick={() => {
                            const form = shippingForm[order.orderId];
                            if (!form || !form.carrier || !form.tracking) return alert("Carrier partner and tracking number needed");
                            handleAction(adminShipOrder, order, form.carrier, form.tracking);
                          }}>Ship Order</button>
                        </div>
                      )}
                      {order.status === 'SHIPPED' && (
                        <button className="admin-btn-action" onClick={() => handleAction(adminOutForDelivery, order)}>Mark Out for Delivery</button>
                      )}
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button className="admin-btn-action" style={{ background: '#10b981' }} onClick={() => handleAction(adminDeliverOrder, order)}>Mark Delivered</button>
                      )}

                      {/* Cancellation Approvals */}
                      {order.cancellation?.requested && order.cancellation.status === 'PENDING' && (
                        <div style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: '#f87171', fontSize: '13px' }}>
                            <strong>Cancellation Requested:</strong> {order.cancellation.reason || 'Requested by user'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="admin-btn-danger" onClick={() => handleAction(adminApproveCancellation, order)}>Approve Cancellation</button>
                            <button className="admin-btn-secondary" onClick={() => handleAction(adminRejectCancellation, order)}>Reject</button>
                          </div>
                        </div>
                      )}

                      {/* Return Approvals */}
                      {order.return?.requested && order.return.status === 'PENDING' && (
                        <div style={{ width: '100%', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: '#fbbf24', fontSize: '13px' }}>
                            <strong>Return Requested:</strong> {order.return.reason} (Resolution: {order.return.resolution})
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="admin-btn-warning" onClick={() => handleAction(adminApproveReturn, order)}>Approve Return</button>
                            <button className="admin-btn-secondary" onClick={() => handleAction(adminRejectReturn, order)}>Reject</button>
                          </div>
                        </div>
                      )}

                      {/* Refund Processing */}
                      {order.refund?.status && !['COMPLETED', 'REJECTED'].includes(order.refund.status) && (
                        <div style={{ width: '100%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ color: '#34d399', fontSize: '13px' }}>
                            <strong>Refund Status:</strong> {order.refund.status}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {order.refund.status === 'PENDING' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'APPROVED')}>Approve Refund</button>}
                            {order.refund.status === 'APPROVED' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'PROCESSING')}>Process Refund</button>}
                            {order.refund.status === 'PROCESSING' && <button className="admin-btn-success" onClick={() => handleAction(adminProcessRefund, order, 'COMPLETED')}>Complete Refund</button>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: EKART CATALOG & INVENTORY ===================== */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                  eKart Catalog & Inventory Control
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Add new gadgets, adjust retail pricing, manage stock quantities, or delete products
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} /> Add Product to Store
              </button>
            </div>

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {productsList.map(product => (
                <div key={product.id} style={{ background: '#0d1322', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                  <img src={product.image} alt={product.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div style={{ padding: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase' }}>{product.category}</span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>${product.price}</span>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#f8fafc' }}>{product.name}</h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '12px', color: '#94a3b8' }}>
                      <span>Stock Units:</span>
                      <input
                        type="number"
                        min="0"
                        value={product.stock}
                        onChange={(e) => handleStockChange(product.id, e.target.value)}
                        style={{
                          width: '70px',
                          background: '#090d16',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#f8fafc',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          textAlign: 'center',
                          fontSize: '13px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        style={{
                          flex: 1,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          padding: '8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Delete Product
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Product Modal */}
            {showAddProductModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0d1322', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '16px', padding: '28px', width: '460px', maxWidth: '90%' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>Add Product to eKart Store</h3>
                  <form onSubmit={handleCreateProduct}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Product Name:</label>
                      <input type="text" required value={newProductData.name} onChange={e => setNewProductData({...newProductData, name: e.target.value})} className="admin-input-full" placeholder="e.g. Ultra Gaming Monitor 27" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Category:</label>
                        <select value={newProductData.category} onChange={e => setNewProductData({...newProductData, category: e.target.value})} className="admin-input-full">
                          <option value="Smartphones">Smartphones</option>
                          <option value="Laptops">Laptops</option>
                          <option value="Headphones">Headphones</option>
                          <option value="Smartwatches">Smartwatches</option>
                          <option value="Monitors">Monitors</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Price ($):</label>
                        <input type="number" step="0.01" required value={newProductData.price} onChange={e => setNewProductData({...newProductData, price: e.target.value})} className="admin-input-full" placeholder="299.99" />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Initial Stock Units:</label>
                      <input type="number" value={newProductData.stock} onChange={e => setNewProductData({...newProductData, stock: e.target.value})} className="admin-input-full" />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Image URL (Unsplash or Direct):</label>
                      <input type="url" value={newProductData.image} onChange={e => setNewProductData({...newProductData, image: e.target.value})} className="admin-input-full" placeholder="https://images.unsplash.com/..." />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => setShowAddProductModal(false)} className="admin-cancel-btn">Cancel</button>
                      <button type="submit" className="admin-confirm-btn">Publish to eKart</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 6: STORE CONTROLS & SETTINGS ===================== */}
        {activeTab === 'settings' && (
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
              Store & Global Controls
            </h1>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#94a3b8' }}>
              Configure global storefront banners, AI escalation triggers, and demo data resets
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              {/* Store Announcement */}
              <div style={{ background: '#0d1322', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#f8fafc' }}>Global Store Banner Announcement</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8' }}>Broadcast messages to all visitors on the eKart store page</p>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="admin-input-full"
                  style={{ marginBottom: '12px' }}
                />
                <button onClick={handleSaveAnnouncement} className="admin-confirm-btn">Save Announcement</button>
              </div>

              {/* Reset Demo Data */}
              <div style={{ background: '#0d1322', padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#f87171' }}>System Factory Reset</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8' }}>
                  Reset sample orders, tickets, and registered users back to clean defaults for fresh testing.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Reset all test orders, support tickets, and users to initial factory state?")) {
                      localStorage.removeItem('vmart_support_tickets');
                      localStorage.removeItem('vmart_registered_users');
                      localStorage.removeItem('vmart_products_catalog');
                      window.location.reload();
                    }
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid #ef4444',
                    color: '#f87171',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <RefreshCw size={14} style={{ display: 'inline', marginRight: '6px' }} /> Reset System Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-glow-btn {
          border: 1px solid;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .admin-glow-btn:hover {
          transform: translateY(-1px);
        }
        .admin-input-full {
          width: 100%;
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }
        .admin-input-full:focus {
          border-color: #10b981;
        }
        .admin-input-small {
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
        }
        .admin-btn-action {
          background: #334155;
          color: #f8fafc;
          border: none;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .admin-btn-action:hover { background: #475569; }
        .admin-btn-danger {
          background: #ef4444;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .admin-btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
        }
        .admin-btn-warning {
          background: #f59e0b;
          color: #000;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
        }
        .admin-btn-success {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .admin-confirm-btn {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }
        .admin-cancel-btn {
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default Admin;
