import React, { useState } from 'react';
import { PRODUCTS } from './mockData';
import { ShoppingCart, Star, ArrowLeft } from 'lucide-react';

const Store = ({ onCreateOrder }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const handleOrder = () => {
    if (selectedProduct) {
      onCreateOrder(selectedProduct, quantity);
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  if (selectedProduct) {
    return (
      <div className="store-container" style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
        <button 
          onClick={() => setSelectedProduct(null)} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
        >
          <ArrowLeft size={18} /> Back to Store
        </button>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px', maxWidth: '500px' }}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', aspectRatio: '1/1' }} />
          </div>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedProduct.category}</div>
            <h1 style={{ margin: '0 0 16px 0', fontSize: '32px' }}>{selectedProduct.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px' }}>
              <Star size={16} fill="var(--accent-color)" color="var(--accent-color)" />
              <span>{selectedProduct.rating} / 5.0</span>
            </div>
            <h2 style={{ fontSize: '28px', margin: '0 0 24px 0', color: 'var(--text-main)' }}>${selectedProduct.price.toFixed(2)}</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '32px' }}>{selectedProduct.description}</p>
            
            <h3 style={{ marginBottom: '16px' }}>Specifications</h3>
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '32px' }}>
              {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ width: '120px', color: 'var(--text-muted)' }}>{key}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <span style={{ color: selectedProduct.stock > 0 ? '#10b981' : '#ef4444' }}>
                {selectedProduct.stock > 0 ? `In Stock (${selectedProduct.stock})` : 'Out of Stock'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }}
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>Qty: {n}</option>
                ))}
              </select>
              <button 
                onClick={handleOrder}
                disabled={selectedProduct.stock === 0}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  background: 'var(--accent-gradient)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: selectedProduct.stock === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: selectedProduct.stock === 0 ? 0.5 : 1
                }}
              >
                <ShoppingCart size={18} /> Order Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="store-container" style={{ padding: '30px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ marginBottom: '30px' }}>V MART Store</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {PRODUCTS.map(product => (
          <div key={product.id} className="product-card" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-light)', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => setSelectedProduct(product)}>
            <div style={{ height: '220px', overflow: 'hidden' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ color: 'var(--accent-color)', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>{product.category.toUpperCase()}</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{product.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>${product.price.toFixed(2)}</span>
                <span style={{ fontSize: '12px', color: product.stock > 0 ? '#10b981' : '#ef4444' }}>
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <button 
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  marginTop: '16px', 
                  background: 'transparent', 
                  border: '1px solid var(--accent-color)', 
                  color: 'var(--accent-color)', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;
