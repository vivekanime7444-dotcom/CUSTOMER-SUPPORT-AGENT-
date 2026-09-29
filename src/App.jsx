import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Paperclip, MoreVertical, Search, 
  MessageSquare, Phone, Video, Info, 
  Sparkles, ShieldCheck, Clock, User,
  ShoppingBag, Package, Settings, RotateCcw
} from 'lucide-react';
import Store from './Store';
import Orders from './Orders';
import Admin from './Admin';
import { INITIAL_ORDERS } from './mockData';

const API_BASE = import.meta.env.VITE_API_URL || '';

const INITIAL_MESSAGES = [
  {
    id: 1,
    text: "Hello! Welcome to V Mart Support. How can I help you today?",
    sender: 'agent',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'store', 'orders'
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('nova_mart_orders_v2');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(o => ({
        ...o,
        status: (o.status || 'ORDER_PLACED').toUpperCase().replace(' ', '_'),
        cancellation: o.cancellation || { requested: false, status: null },
        return: o.return || { requested: false, status: null },
        refund: o.refund || { status: null },
        replacement: o.replacement || { status: null },
        trackingEvents: o.trackingEvents || []
      }));
    } catch {
      return [];
    }
  });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('nova_mart_orders_v2', JSON.stringify(orders));
  }, [orders]);

  const handleCreateOrder = (product, quantity) => {
    const newOrder = {
      orderId: `NM-${10000 + orders.length + 1}`,
      customerId: 'CUST-1',
      customerName: 'Test Customer',
      items: [{
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity
      }],
      totalAmount: product.price * quantity,
      orderDate: new Date().toLocaleString(),
      status: "ORDER_PLACED",
      confirmation: { status: null, approvedBy: null, approvedAt: null },
      processing: { startedAt: null, approvedBy: null },
      shipping: { carrier: null, trackingNumber: null, shippedAt: null },
      delivery: { 
        estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(), 
        outForDeliveryAt: null, 
        deliveredAt: null 
      },
      cancellation: { requested: false, requestedAt: null, reason: null, status: null, processedBy: null, processedAt: null },
      return: { requested: false, requestedAt: null, reason: null, resolution: null, status: null, processedBy: null, processedAt: null },
      refund: { status: null, amount: null, processedAt: null, processedBy: null },
      replacement: { requested: false, status: null, processedAt: null, processedBy: null },
      trackingEvents: [
        { date: new Date().toLocaleString(), event: "Order placed" }
      ]
    };
    setOrders(prev => [newOrder, ...prev]);
    alert(`Order ${newOrder.orderId} placed successfully!`);
    setActiveTab('orders');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText;
    const newMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const formattedHistory = messages.map(msg => ({
        role: msg.sender === 'agent' ? 'assistant' : 'user',
        content: msg.text
      }));

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userText,
          history: formattedHistory,
          customerId: 'CUST-1',
          activeOrderId: activeOrderId,
          orders: orders
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[FRONTEND] Server returned ${response.status} ${response.statusText}`);
        console.error(`[FRONTEND] Response body:`, data);
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.activeOrderId) {
        setActiveOrderId(data.activeOrderId);
      }

      const agentReply = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requiresOrderSelection: data.requiresOrderSelection || false,
        orderOptions: data.orderOptions || [],
        memoryUsed: data.memoryUsed || false,
        memoryContext: data.memoryContext || null
      };
      setMessages(prev => [...prev, agentReply]);
    } catch (error) {
      console.error('[FRONTEND] Error fetching chat response:', error);
      console.error('[FRONTEND] Error name:', error.name, 'Message:', error.message);
      const errorReply = {
        id: Date.now() + 1,
        text: error.message || "Sorry, I'm having trouble connecting to the server right now.",
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSelection = async (selectedOrderId) => {
    if (isLoading) return;

    const selectedOrder = orders.find(o => o.orderId === selectedOrderId);
    const pName = selectedOrder?.items?.[0]?.productName || selectedOrder?.productName || 'Order';
    const userText = `Selected order #${selectedOrderId} (${pName})`;

    const newMessage = {
      id: Date.now(),
      text: userText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setActiveOrderId(selectedOrderId);
    setIsLoading(true);

    try {
      const formattedHistory = messages.map(msg => ({
        role: msg.sender === 'agent' ? 'assistant' : 'user',
        content: msg.text
      }));

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please check the details and status for order ${selectedOrderId}.`,
          history: formattedHistory,
          customerId: 'CUST-1',
          activeOrderId: selectedOrderId,
          orderId: selectedOrderId,
          orders: orders
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[FRONTEND] Server returned ${response.status} ${response.statusText}`);
        console.error(`[FRONTEND] Response body:`, data);
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.activeOrderId) {
        setActiveOrderId(data.activeOrderId);
      }

      const agentReply = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        requiresOrderSelection: data.requiresOrderSelection || false,
        orderOptions: data.orderOptions || [],
        memoryUsed: data.memoryUsed || false,
        memoryContext: data.memoryContext || null
      };
      setMessages(prev => [...prev, agentReply]);
    } catch (error) {
      console.error('[FRONTEND] Error fetching selection response:', error);
      const errorReply = {
        id: Date.now() + 1,
        text: error.message || "Sorry, I'm having trouble checking that order.",
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <div className="brand-title">V MART</div>
            <div className="brand-subtitle">Support Hub</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-title">Main Navigation</div>
          <div className={`chat-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} style={{ cursor: 'pointer' }}>
            <div className="avatar">
              <MessageSquare size={20} color={activeTab === 'chat' ? "#fff" : "#94a3b8"} />
            </div>
            <div className="chat-info">
              <div className="chat-name">AI Support</div>
            </div>
          </div>
          <div className={`chat-item ${activeTab === 'store' ? 'active' : ''}`} onClick={() => setActiveTab('store')} style={{ cursor: 'pointer' }}>
            <div className="avatar">
              <ShoppingBag size={20} color={activeTab === 'store' ? "#fff" : "#94a3b8"} />
            </div>
            <div className="chat-info">
              <div className="chat-name">Store</div>
            </div>
          </div>
          <div className={`chat-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} style={{ cursor: 'pointer' }}>
            <div className="avatar">
              <Package size={20} color={activeTab === 'orders' ? "#fff" : "#94a3b8"} />
            </div>
            <div className="chat-info">
              <div className="chat-name">My Orders</div>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)' }}>
           <div className={`chat-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')} style={{ cursor: 'pointer' }}>
              <div className="avatar" style={{background: 'var(--accent-gradient)'}}>
                <Settings size={20} color="white" />
              </div>
              <div className="chat-info">
                <div className="chat-name">Admin Console</div>
                <div className="chat-preview" style={{color: '#10b981'}}>Development</div>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-chat" style={{ display: activeTab === 'chat' ? 'flex' : 'none' }}>
        {/* Header */}
        <header className="chat-header">
          <div className="header-user-info">
            <div className="avatar" style={{ background: activeOrderId ? '#334155' : 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {activeOrderId ? <Package size={18} color="white" /> : <Sparkles size={18} color="white" />}
              <div className="status-dot"></div>
            </div>
            <div>
              <div className="header-name">
                {activeOrderId ? `Order Tracking — #${activeOrderId}` : 'V Mart AI Support'}
              </div>
              <div className="header-status">Live Support connected</div>
            </div>
          </div>
          <div className="header-actions">
            {activeOrderId && (
              <button 
                className="icon-btn" 
                title="Clear active order filter" 
                onClick={() => setActiveOrderId(null)}
                style={{ fontSize: '12px', padding: '4px 10px', width: 'auto', borderRadius: '6px', color: 'var(--text-muted)' }}
              >
                Clear Context
              </button>
            )}
            <button 
              className="icon-btn" 
              title="Start New Chat" 
              onClick={() => {
                setMessages([
                  {
                    id: Date.now(),
                    text: "Hello! Welcome to V Mart Support. How can I help you today?",
                    sender: 'agent',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
                setActiveOrderId(null);
              }}
            >
              <RotateCcw size={18} />
            </button>
            <button className="icon-btn"><Phone size={18} /></button>
            <button className="icon-btn"><Video size={18} /></button>
            <button className="icon-btn"><Search size={18} /></button>
            <button className="icon-btn"><Info size={18} /></button>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-container">
          <div className="system-message">Live session connected • Secure chat</div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender === 'user' ? 'outgoing' : 'incoming'}`}>
              {msg.sender === 'agent' && (
                <div className="avatar" style={{width: 32, height: 32, background: 'var(--accent-gradient)'}}>
                  <Sparkles size={16} color="white" />
                </div>
              )}
              <div className="message-content">
                <div className="message-bubble">
                  {msg.text}

                  {msg.sender === 'agent' && msg.memoryUsed && msg.memoryContext && (
                    <div className="memory-used-indicator" data-testid="memory-indicator">
                      <span className="memory-used-icon">🧠</span>
                      <div className="memory-used-body">
                        <span className="memory-used-title">Memory used</span>
                        <span className="memory-used-desc">{msg.memoryContext.label}</span>
                      </div>
                    </div>
                  )}

                  {((msg.requiresOrderSelection && msg.orderOptions && msg.orderOptions.length > 0) || 
                    (msg.sender === 'agent' && !activeOrderId && orders.length > 1 && /(which order|which one|order id or the product name|select an order|which of these|shipping information for\?)/i.test(msg.text))) && (
                    <div className="order-selector-container">
                      {(msg.orderOptions && msg.orderOptions.length > 0 ? msg.orderOptions : orders.map(o => ({
                        orderId: o.orderId,
                        productName: o.items?.[0]?.productName || o.productName || 'Product',
                        status: o.status,
                        returnStatus: o.return?.requested ? (o.return.status || 'PENDING') : null,
                        refundStatus: o.refund?.status || null
                      }))).map((opt) => (
                        <div 
                          key={opt.orderId} 
                          className="order-option-card"
                          onClick={() => handleOrderSelection(opt.orderId)}
                          role="button"
                          tabIndex={0}
                        >
                          <div>
                            <div className="order-option-header">
                              <span className="order-option-id">#{opt.orderId}</span>
                              <span className="order-option-product">{opt.productName}</span>
                            </div>
                            <div className="order-option-badges">
                              <span className={`order-status-badge ${
                                opt.status === 'DELIVERED' ? 'badge-delivered' :
                                opt.status === 'ORDER_PLACED' ? 'badge-placed' :
                                opt.status === 'PROCESSING' ? 'badge-processing' : 'badge-shipped'
                              }`}>
                                {opt.status ? opt.status.replace(/_/g, ' ') : 'ORDER PLACED'}
                              </span>
                              {opt.returnStatus && (
                                <span className="order-status-badge badge-return">
                                  Return: {opt.returnStatus}
                                </span>
                              )}
                              {opt.refundStatus && (
                                <span className="order-status-badge badge-refund">
                                  Refund: {opt.refundStatus}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="order-select-action">
                            Select Order &rarr;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="message-time">{msg.timestamp}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message-wrapper incoming">
              <div className="avatar" style={{width: 32, height: 32, background: 'var(--accent-gradient)'}}>
                <Sparkles size={16} color="white" />
              </div>
              <div className="message-content">
                <div className="message-bubble" style={{display: 'flex', gap: '4px', alignItems: 'center', padding: '14px 18px'}}>
                  <div className="typing-dot" style={{width: 6, height: 6, background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite'}} />
                  <div className="typing-dot" style={{width: 6, height: 6, background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s'}} />
                  <div className="typing-dot" style={{width: 6, height: 6, background: 'var(--text-main)', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s'}} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area">
          <div className="input-container">
            <button className="icon-btn" style={{border: 'none', background: 'transparent'}}>
              <Paperclip size={20} />
            </button>
            <textarea
              className="message-input"
              placeholder="Type your message here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button 
              className="send-btn" 
              onClick={handleSend}
              disabled={!inputText.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>

      {activeTab === 'store' && (
        <main className="main-chat" style={{ background: 'var(--bg-main)', overflow: 'hidden' }}>
          <Store onCreateOrder={handleCreateOrder} />
        </main>
      )}

      {activeTab === 'orders' && (
        <main className="main-chat" style={{ background: 'var(--bg-main)', overflow: 'hidden' }}>
          <Orders orders={orders} setOrders={setOrders} onNavigateToStore={() => setActiveTab('store')} />
        </main>
      )}

      {activeTab === 'admin' && (
        <main className="main-chat" style={{ background: 'var(--bg-main)', overflow: 'hidden' }}>
          <Admin orders={orders} setOrders={setOrders} />
        </main>
      )}
    </div>
  );
}

export default App;
