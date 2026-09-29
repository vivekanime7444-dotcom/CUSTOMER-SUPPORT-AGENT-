import React, { useState, useMemo, useEffect } from 'react';
import { getProducts } from './utils/productStore';
import { 
  ShoppingCart, Star, ArrowLeft, Search, Zap, 
  Check, Eye, Truck, ShieldCheck, Sparkles, Plus, Minus,
  ShoppingBag, CheckCircle2
} from 'lucide-react';

const CATEGORIES = ['All', 'Smartphones', 'Laptops', 'Headphones', 'Smartwatches', 'Monitors', 'Accessories'];

const Store = ({ onCreateOrder, onNavigateToOrders, onNavigateToSupport }) => {
  const [productsList, setProductsList] = useState(getProducts);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyOrdered, setRecentlyOrdered] = useState(null);

  useEffect(() => {
    const handleProductsUpdated = () => {
      setProductsList(getProducts());
    };
    window.addEventListener('vmart_products_updated', handleProductsUpdated);
    return () => window.removeEventListener('vmart_products_updated', handleProductsUpdated);
  }, []);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [productsList, activeCategory, searchQuery]);

  const handleOrder = (productToOrder, qty) => {
    const p = productToOrder || selectedProduct;
    const q = qty || quantity;
    if (p) {
      onCreateOrder(p, q);
      setRecentlyOrdered({ product: p, quantity: q });
      setSelectedProduct(null);
      setQuantity(1);
      setTimeout(() => setRecentlyOrdered(null), 5000);
    }
  };

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.06), transparent 30%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.06), transparent 30%), var(--bg-base)',
      padding: '28px 36px',
      color: 'var(--text-main)'
    }}>
      {/* Toast notification on order placed */}
      {recentlyOrdered && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '28px',
          zIndex: 9999,
          background: 'rgba(19, 20, 31, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '16px',
          padding: '16px 20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>
              Order Placed Successfully!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {recentlyOrdered.quantity}x {recentlyOrdered.product.name} added to My Orders
            </div>
          </div>
        </div>
      )}

      {/* Hero Showcase Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.12) 50%, rgba(19, 20, 31, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '36px 40px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '240px',
          height: '240px',
          background: 'rgba(99, 102, 241, 0.25)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#a5b4fc',
              marginBottom: '14px'
            }}>
              <Sparkles size={14} /> Official eKart Tech Store
            </div>
            <h1 style={{
              fontSize: '34px',
              fontWeight: 700,
              margin: '0 0 10px 0',
              letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Next-Gen Tech & Electronics
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: '1.6',
              margin: '0 0 20px 0'
            }}>
              Discover premium laptops, smartphones, wearables, and audio gear with instant checkout, live tracking, and 24/7 AI-powered support.
            </p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                <Truck size={16} color="#10b981" /> Free Express Delivery
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                <ShieldCheck size={16} color="#6366f1" /> 1-Year Official Warranty
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                <Zap size={16} color="#fbbf24" /> Instant AI Support
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', maxWidth: '100%' }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '30px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.08)',
                  background: isActive ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.03)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.3)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '8px 16px',
          width: '280px',
          transition: 'all 0.2s ease'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search eKart products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '20px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <h3>No products found</h3>
          <p style={{ fontSize: '14px' }}>Try selecting a different category or clearing your search filter.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '24px'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid var(--border-light)',
                borderRadius: '18px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: 'var(--box-shadow-card)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.45)';
                e.currentTarget.style.boxShadow = 'var(--box-shadow-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.boxShadow = 'var(--box-shadow-card)';
              }}
            >
              {/* Product Image Area */}
              <div 
                style={{
                  height: '210px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0d0e15',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedProduct(product)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
                
                {/* Floating Category & Rating Tags */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(10, 10, 15, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#a5b4fc',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  {product.category}
                </div>

                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(10, 10, 15, 0.75)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 8px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fbbf24',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star size={12} fill="#fbbf24" color="#fbbf24" />
                  {product.rating}
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '17px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#f8fafc'
                  }}
                >
                  {product.name}
                </h3>
                
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  margin: '0 0 16px 0',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {product.description}
                </p>

                {/* Price and Stock Row */}
                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '16px'
                }}>
                  <div>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc' }}>
                      ${product.price.toFixed(2)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: product.stock > 0 ? '#10b981' : '#ef4444'
                  }}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOrder(product, 1)}
                    disabled={product.stock === 0}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)'
                    }}
                  >
                    <ShoppingCart size={15} /> Buy Now
                  </button>

                  <button
                    onClick={() => setSelectedProduct(product)}
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    title="View Product Specifications"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'rgba(19, 20, 31, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            maxWidth: '820px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '36px',
            position: 'relative',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
          }}>
            <button
              onClick={() => { setSelectedProduct(null); setQuantity(1); }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#f8fafc',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {/* Product Image */}
              <div style={{ flex: '1 1 320px', maxWidth: '360px' }}>
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  style={{
                    width: '100%',
                    borderRadius: '16px',
                    aspectRatio: '1/1',
                    objectFit: 'cover',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                />
              </div>

              {/* Product Info */}
              <div style={{ flex: '1 1 360px' }}>
                <div style={{
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px'
                }}>
                  {selectedProduct.category}
                </div>

                <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 12px 0' }}>
                  {selectedProduct.name}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedProduct.rating}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/ 5.0 Rating</span>
                </div>

                <div style={{ fontSize: '32px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                  ${(selectedProduct.price * quantity).toFixed(2)}
                  {quantity > 1 && (
                    <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '10px' }}>
                      (${selectedProduct.price.toFixed(2)} each)
                    </span>
                  )}
                </div>

                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                  {selectedProduct.description}
                </p>

                {/* Specifications table */}
                <h4 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.5px' }}>
                  Technical Specifications
                </h4>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '24px'
                }}>
                  {Object.entries(selectedProduct.specifications || {}).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Quantity and Order Button */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '4px'
                  }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ padding: '0 12px', fontWeight: 600, fontSize: '15px' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleOrder(selectedProduct, quantity)}
                    disabled={selectedProduct.stock === 0}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    <ShoppingCart size={18} /> Confirm Order (${(selectedProduct.price * quantity).toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store;
