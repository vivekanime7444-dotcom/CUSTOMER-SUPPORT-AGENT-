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
  Shield, CheckCircle2, ChevronRight, UserCheck, UserX, Key,
  Sparkles, Radio, Layers
} from 'lucide-react';

const Admin = ({ orders, setOrders }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tickets', 'users', 'orders', 'products', 'settings'
  
  // Stores state
  const [tickets, setTickets] = useState(getTickets);
  const [usersList, setUsersList] = useState(getUsers);
  const [productsList, setProductsList] = useState(getProducts);

  // Support tickets state
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

  // Sync state with custom events
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
    alert(`Resolution dispatched for Ticket #${selectedTicket.id}! The customer will receive this message directly in their live chat session.`);
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
    if (window.confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) {
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

  const handleSaveAnnouncement = () => {
    localStorage.setItem('vmart_store_announcement', announcement);
    alert("Store announcement updated.");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: 'var(--bg-base)', color: 'var(--text-main)', overflow: 'hidden' }}>
      
      {/* ===================== SINGLE TOP ADMIN MENU BAR ===================== */}
      <header className="admin-header-bar" style={{
        background: 'rgba(18, 25, 44, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-light)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        zIndex: 20
      }}>
        {/* Left: Badge & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Admin Console
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                Master Access
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Centralized System Controls & Support Escalation Hub
            </div>
          </div>
        </div>

        {/* Right: Single Segmented Menu Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(10, 14, 26, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '4px',
          overflowX: 'auto',
          maxWidth: '100%'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { 
              id: 'tickets', 
              label: 'Human Tickets', 
              icon: MessageSquare,
              badge: summary.pendingTickets > 0 ? summary.pendingTickets : null,
              badgeColor: '#ef4444'
            },
            { id: 'users', label: 'Users', icon: Users, badge: summary.totalUsers },
            { 
              id: 'orders', 
              label: 'Orders', 
              icon: Package,
              badge: summary.pendingActions > 0 ? summary.pendingActions : null,
              badgeColor: '#f59e0b'
            },
            { id: 'products', label: 'eKart Inventory', icon: ShoppingBag, badge: summary.catalogCount },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(99, 102, 241, 0.45)' : 'transparent',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.22), rgba(6, 182, 212, 0.12))' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 2px 10px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)' : 'none'
                }}
              >
                <Icon size={15} color={isActive ? '#38bdf8' : '#94a3b8'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    background: tab.badgeColor || 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '2px'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ===================== WORKSPACE CONTENT ===================== */}
      <div className="admin-workspace" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 32px',
        background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05), transparent 30%), var(--bg-base)'
      }}>

        {/* ===================== TAB 1: OVERVIEW & KPIS ===================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  System Overview & Operations
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Live metrics across customer inquiries, orders, users, and eKart stock
                </p>
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                <span>Live Admin Sync Active</span>
              </div>
            </div>

            {/* High Priority Attention Banner */}
            {summary.pendingTickets > 0 && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.06) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '16px',
                padding: '18px 22px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(239, 68, 68, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
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
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
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
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.35)'
                  }}
                >
                  Review Tickets <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { label: 'Total Revenue', val: `$${summary.revenue.toFixed(2)}`, icon: DollarSign, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' },
                { label: 'Total Orders', val: summary.totalOrders, icon: Package, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' },
                { label: 'Pending Human Tickets', val: summary.pendingTickets, icon: MessageSquare, color: summary.pendingTickets > 0 ? '#f87171' : '#10b981', bg: summary.pendingTickets > 0 ? 'rgba(248, 113, 113, 0.12)' : 'rgba(16, 185, 129, 0.12)' },
                { label: 'Registered Users', val: `${summary.activeUsers} / ${summary.totalUsers}`, icon: Users, color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' },
                { label: 'Pending Cancels/Returns', val: summary.pendingActions, icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' },
                { label: 'eKart Catalog Items', val: summary.catalogCount, icon: ShoppingBag, color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)' }
              ].map(kpi => {
                const Icon = kpi.icon;
                return (
                  <div key={kpi.label} style={{
                    background: 'rgba(18, 25, 44, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)',
                    transition: 'all 0.25s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em' }}>{kpi.label}</span>
                      <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                        <Icon size={17} />
                      </div>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: kpi.color }}>
                      {kpi.val}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Cards */}
            <div style={{
              background: 'rgba(18, 25, 44, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              padding: '22px',
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
              <h3 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 600, color: '#cbd5e1' }}>
                Quick Administration Shortcuts
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setActiveTab('tickets'); setTicketFilter('PENDING'); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)', color: '#f87171' }}
                >
                  <MessageSquare size={15} /> Resolve Support Tickets ({summary.pendingTickets})
                </button>
                <button 
                  onClick={() => { setActiveTab('users'); setShowAddUserModal(true); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)', color: '#34d399' }}
                >
                  <Users size={15} /> Add New User
                </button>
                <button 
                  onClick={() => { setActiveTab('products'); setShowAddProductModal(true); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(129, 140, 248, 0.12)', borderColor: 'rgba(129, 140, 248, 0.35)', color: '#818cf8' }}
                >
                  <Plus size={15} /> Add Product to eKart
                </button>
                <button 
                  onClick={() => { setActiveTab('orders'); }}
                  className="admin-glow-btn"
                  style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.35)', color: '#38bdf8' }}
                >
                  <Package size={15} /> Process Orders ({summary.pendingActions} pending)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: SUPPORT TICKETS & HUMAN ESCALATIONS ===================== */}
        {activeTab === 'tickets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  Contact Support & Human Escalation Tickets
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Inquiries escalated by customers when the AI assistant cannot solve the issue
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
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: ticketFilter === filter.id ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                      background: ticketFilter === filter.id ? 'rgba(16, 185, 129, 0.18)' : 'rgba(18, 25, 44, 0.7)',
                      color: ticketFilter === filter.id ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Tickets list + Resolution workspace */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.25fr' : '1fr', gap: '20px' }}>
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
                          background: isSelected ? 'rgba(28, 38, 66, 0.85)' : 'rgba(18, 25, 44, 0.7)',
                          border: '1px solid',
                          borderColor: isSelected ? '#10b981' : (isPending ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'),
                          borderRadius: '16px',
                          padding: '18px 20px',
                          cursor: 'pointer',
                          transition: 'all 0.22s ease',
                          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '13.5px' }}>#{ticket.id}</span>
                            {isPending && (
                              <span style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                padding: '2px 7px',
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
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{ticket.createdAt}</span>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '14.5px', color: '#f8fafc', marginBottom: '6px' }}>
                          {ticket.subject}
                        </div>

                        <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.45' }}>
                          {ticket.message}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748b' }}>
                          <div>
                            <span>User: <strong style={{ color: '#cbd5e1' }}>{ticket.customerName}</strong></span>
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

              {/* Resolution Workspace */}
              {selectedTicket && (
                <div style={{
                  background: 'rgba(18, 25, 44, 0.85)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 12px 36px rgba(0, 0, 0, 0.55)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
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
                        Customer: {selectedTicket.customerName} ({selectedTicket.customerEmail})
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
                  <div style={{ background: '#0a0e1a', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      Customer Inquiry / Issue Description:
                    </div>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5' }}>
                      {selectedTicket.message}
                    </div>
                  </div>

                  {/* Prior chat transcript */}
                  {selectedTicket.transcript && selectedTicket.transcript.length > 0 && (
                    <div style={{ background: '#0a0e1a', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <div style={{ color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Conversation Snippet:</div>
                      {selectedTicket.transcript.map((msg, idx) => (
                        <div key={idx} style={{ marginBottom: '4px', color: msg.sender === 'customer' ? '#cbd5e1' : '#818cf8' }}>
                          <strong>{msg.sender === 'customer' ? 'Customer' : 'AI Agent'}:</strong> {msg.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Resolution Templates */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Quick Resolution Templates:</div>
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
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
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
                        Admin Resolution Message (Delivered Live into User's Chat Session):
                      </label>
                      <textarea
                        rows={3}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Write official resolution for the customer..."
                        style={{
                          width: '100%',
                          background: '#0a0e1a',
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>Status:</label>
                        <select
                          value={ticketStatusSelect}
                          onChange={(e) => setTicketStatusSelect(e.target.value)}
                          style={{
                            width: '100%',
                            background: '#0a0e1a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            padding: '9px',
                            borderRadius: '8px',
                            fontSize: '12.5px'
                          }}
                        >
                          <option value="RESOLVED">RESOLVED (Solved by Admin)</option>
                          <option value="IN_PROGRESS">IN PROGRESS (Working On It)</option>
                          <option value="PENDING">PENDING (Keep Active)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>Admin Notes:</label>
                        <input
                          type="text"
                          value={adminNotesText}
                          onChange={(e) => setAdminNotesText(e.target.value)}
                          placeholder="Internal admin notes..."
                          style={{
                            width: '100%',
                            background: '#0a0e1a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#f8fafc',
                            padding: '9px',
                            borderRadius: '8px',
                            fontSize: '12.5px'
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
                        fontSize: '13.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                      }}
                    >
                      <Send size={15} /> Submit Resolution & Notify Customer in Live Chat
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  User Management & Access Control
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Manage customer and administrator accounts, roles, access statuses, and security credentials
                </p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)'
                }}
              >
                <Plus size={16} /> Add New User
              </button>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(18, 25, 44, 0.7)',
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
                  background: 'rgba(18, 25, 44, 0.7)',
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
            <div style={{
              background: 'rgba(18, 25, 44, 0.7)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
            }}>
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
                              background: u.role === 'admin' ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #6366f1, #3b82f6)',
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0e1424', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '18px', padding: '28px', width: '440px', maxWidth: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>Create Account</h3>
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
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Password:</label>
                      <input type="password" required value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} className="admin-input-full" placeholder="Min 6 characters" />
                    </div>
                    <div style={{ marginBottom: '18px' }}>
                      <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Role:</label>
                      <select value={newUserData.role} onChange={e => setNewUserData({...newUserData, role: e.target.value})} className="admin-input-full">
                        <option value="user">Customer (Regular Account)</option>
                        <option value="admin">Administrator (Full Access)</option>
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0e1424', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '18px', padding: '24px', width: '380px', maxWidth: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', color: '#f8fafc' }}>Reset Password</h3>
                  <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>
                    Resetting password for: <strong style={{ color: '#f8fafc' }}>{passwordResetUser.name}</strong>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  Order Logistics & Lifecycle Controls
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Manage dispatch, shipping carriers, cancellation approvals, and refund authorizations
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', 'ORDER_PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: orderStatusFilter === st ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      background: orderStatusFilter === st ? 'rgba(56, 189, 248, 0.15)' : 'rgba(18, 25, 44, 0.7)',
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
                  <div key={order.orderId} style={{
                    background: 'rgba(18, 25, 44, 0.7)',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
                  }}>
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
                    <div style={{ background: '#0a0e1a', padding: '14px 18px', borderRadius: '12px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
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
                            <strong>Cancellation Requested:</strong> {order.cancellation.reason || 'Requested by customer'}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
                  eKart Catalog & Inventory Control
                </h1>
                <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                  Publish gadgets, adjust retail pricing, manage live stock quantities, or delete products
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Plus size={16} /> Add Product to Store
              </button>
            </div>

            {/* Products Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {productsList.map(product => (
                <div key={product.id} style={{
                  background: 'rgba(18, 25, 44, 0.7)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
                }}>
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
                          background: '#0a0e1a',
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
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                <div style={{ background: '#0e1424', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '18px', padding: '28px', width: '460px', maxWidth: '90%', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f8fafc' }}>Add Product to eKart</h3>
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
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.025em', color: '#f8fafc' }}>
              Store & Global Controls
            </h1>
            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#94a3b8' }}>
              Broadcast storefront announcements and reset test data
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              {/* Store Announcement */}
              <div style={{
                background: 'rgba(18, 25, 44, 0.7)',
                padding: '22px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#f8fafc' }}>Store Banner Announcement</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8' }}>Broadcast banner message across the eKart storefront</p>
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="admin-input-full"
                  style={{ marginBottom: '14px' }}
                />
                <button onClick={handleSaveAnnouncement} className="admin-confirm-btn">Save Announcement</button>
              </div>

              {/* Reset Demo Data */}
              <div style={{
                background: 'rgba(18, 25, 44, 0.7)',
                padding: '22px',
                borderRadius: '16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.35)'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#f87171' }}>System Factory Reset</h4>
                <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#94a3b8' }}>
                  Reset test orders, tickets, and user accounts back to clean initial factory defaults.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("Reset all test orders, support tickets, and users to clean factory state?")) {
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
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .admin-input-full {
          width: 100%;
          background: #0a0e1a;
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
          background: #0a0e1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
        }
        .admin-btn-action {
          background: #25334d;
          color: #f8fafc;
          border: none;
          padding: 7px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
        }
        .admin-btn-action:hover { background: #334466; }
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
